package com.group26.heritage.module_b.service;

import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.common.repository.ChinaCityRepository;
import com.group26.heritage.common.repository.ResourceMediaRepository;
import com.group26.heritage.common.repository.ResourceRepository;
import com.group26.heritage.common.repository.ReviewFeedbackRepository;
import com.group26.heritage.common.repository.TagRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Tag;
import com.group26.heritage.entity.ChinaCity;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.ResourceMedia;
import com.group26.heritage.entity.enums.CategoryStatus;
import com.group26.heritage.entity.enums.MediaType;
import com.group26.heritage.entity.enums.ReviewDecision;
import com.group26.heritage.entity.enums.ResourceStatus;
import com.group26.heritage.module_b.dto.ResourceDraftListItem;
import com.group26.heritage.module_b.dto.ResourceRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ResourceService {

    private static final int TITLE_MAX_LENGTH = 30;
    private static final int DESCRIPTION_MAX_LENGTH = 2000;
    private static final long MAX_FILE_BYTES = 50L * 1024 * 1024;
    private static final int MAX_FILES = 5;
    private static final List<String> ALLOWED_FILE_EXTENSIONS = List.of(
            ".docx", ".pdf", ".txt",
            ".png", ".jpg", ".jpeg",
            ".mov", ".mp3"
    );
    private static final List<String> PLACES = List.of("北京", "上海", "广州", "成都", "西安");
    private static final List<String> RECOMMENDED_TAGS = List.of(
            "Intangible Heritage",
            "Oral History",
            "Traditional Crafts",
            "Folk Festival",
            "Artifact"
    );
    private static final List<String> COPYRIGHT_OPTIONS = List.of(
            "原创授权，可用于文化遗产研究与展示",
            "仅限教育与非商业传播，需署名",
            "社区共创内容，引用需注明来源与贡献者",
            "受访者授权发布，禁止二次改编",
            "馆藏资料数字化版本，受馆方版权政策约束"
    );

    private final ResourceRepository repository;
    private final ResourceMediaRepository mediaRepository;
    private final CategoryRepository categoryRepository;
    private final ChinaCityRepository cityRepository;
    private final ReviewFeedbackRepository reviewFeedbackRepository;
    private final TagRepository tagRepository;
    @PersistenceContext
    private EntityManager entityManager;
    private final Path uploadDir;

    public ResourceService(ResourceRepository repository,
                           ResourceMediaRepository mediaRepository,
                           CategoryRepository categoryRepository,
                           ChinaCityRepository cityRepository,
                           ReviewFeedbackRepository reviewFeedbackRepository,
                           TagRepository tagRepository,
                           @Value("${app.upload-dir}") String uploadDir) throws IOException {
        this.repository = repository;
        this.mediaRepository = mediaRepository;
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
        this.reviewFeedbackRepository = reviewFeedbackRepository;
        this.tagRepository = tagRepository;
        this.uploadDir = Paths.get(uploadDir);
        Files.createDirectories(this.uploadDir);
    }

    @Transactional
    public Resource createDraft(Long contributorId) {
        Resource resource = new Resource();
        resource.setTitle("");
        resource.setContributorId(contributorId);
        resource.setStatus(ResourceStatus.DRAFT);
        return repository.save(resource);
    }

    @Transactional
    public Resource saveDraft(Long resourceId, Long contributorId, ResourceRequest payload) {
        Resource resource = mustBeOwner(resourceId, contributorId);
        ensureEditable(resource);
        applyMetadata(resource, payload);
        resource.setStatus(ResourceStatus.DRAFT);
        resource.touch();
        return repository.save(resource);
    }

    @Transactional
    public Resource uploadFiles(Long resourceId, Long contributorId, List<MultipartFile> files) throws IOException {
        Resource resource = mustBeOwner(resourceId, contributorId);
        ensureEditable(resource);
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("请选择上传文件");
        }
        if (files.size() > MAX_FILES) {
            throw new IllegalArgumentException("最多可上传" + MAX_FILES + "个文件");
        }
        List<ResourceMedia> existing = mediaRepository.findByResourceIdOrderBySortOrderAsc(resourceId);
        int sortOrderStart = existing.stream()
                .map(ResourceMedia::getSortOrder)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        boolean hasCover = existing.stream()
                .anyMatch(m -> m.getMediaType() == MediaType.COVER);

        int index = 0;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            if (file.getSize() > MAX_FILE_BYTES) {
                throw new IllegalArgumentException("单个文件不能超过50MB");
            }
            String originalName = Objects.requireNonNull(file.getOriginalFilename());
            validateFileType(originalName);
            String safeName = System.currentTimeMillis() + "_" + originalName.replace(" ", "_");
            Path target = uploadDir.resolve(safeName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            MediaType mediaType = resolveMediaType(originalName);
            if (mediaType == MediaType.DETAIL && !hasCover) {
                mediaType = MediaType.COVER;
                hasCover = true;
            }

            ResourceMedia media = new ResourceMedia();
            media.setResourceId(resourceId);
            media.setMediaType(mediaType);
            media.setFileUrl("/uploads/" + safeName);
            media.setFileName(originalName);
            media.setFileSize(file.getSize());
            media.setMimeType(file.getContentType());
            media.setSortOrder(sortOrderStart + index);
            media.setUploadedAt(LocalDateTime.now());
            mediaRepository.save(media);
            index++;
        }

        resource.touch();
        return repository.save(resource);
    }

    @Transactional
    public Resource updateExternalLinks(Long resourceId, Long contributorId, List<String> externalLinks) {
        Resource resource = mustBeOwner(resourceId, contributorId);
        ensureEditable(resource);
        if (externalLinks == null || externalLinks.isEmpty()) {
            resource.setExternalLink(null);
        } else {
            String joined = externalLinks.stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .reduce((a, b) -> a + "," + b)
                .orElse(null);
            resource.setExternalLink(joined);
        }
        resource.touch();
        return repository.save(resource);
    }

    @Transactional
    public Resource submit(Long resourceId, Long contributorId) {
        Resource resource = mustBeOwner(resourceId, contributorId);
        if (!(resource.getStatus() == ResourceStatus.DRAFT || resource.getStatus() == ResourceStatus.REJECTED)) {
            throw new IllegalStateException("当前状态不可提交审核");
        }
        if (isBlank(resource.getTitle()) || isBlank(resource.getDescription())) {
            throw new IllegalStateException("标题和描述为必填项");
        }
        if (resource.getTitle().length() > TITLE_MAX_LENGTH) {
            throw new IllegalStateException("标题不能超过30字");
        }
        if (resource.getDescription().length() > DESCRIPTION_MAX_LENGTH) {
            throw new IllegalStateException("描述不能超过2000字");
        }
        if (isBlank(resource.getFilePath()) && isBlank(resource.getExternalLink()) &&
            mediaRepository.findByResourceIdOrderBySortOrderAsc(resourceId).isEmpty()) {
            throw new IllegalStateException("提交前必须上传文件或填写外链");
        }
        if (resource.getCategoryId() == null) {
            throw new IllegalStateException("提交前请选择分类");
        }
        Category submitCategory = categoryRepository.findById(resource.getCategoryId())
                .orElseThrow(() -> new IllegalStateException("分类不存在"));
        if (submitCategory.getStatus() != CategoryStatus.ACTIVE) {
            throw new IllegalStateException("所选分类已停用，请更换为启用中的分类后再提交");
        }
        resource.setStatus(ResourceStatus.PENDING_REVIEW);
        resource.touch();
        return repository.save(resource);
    }

    @Transactional
    public Resource review(Long resourceId, boolean approved, String feedback) {
        Resource resource = repository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("资源不存在"));
        if (resource.getStatus() != ResourceStatus.PENDING_REVIEW) {
            throw new IllegalStateException("仅待审核资源可审核");
        }
        if (isBlank(feedback)) {
            throw new IllegalStateException("审核通过或拒绝都必须填写反馈");
        }
        resource.setStatus(approved ? ResourceStatus.APPROVED : ResourceStatus.REJECTED);
        resource.setReviewFeedback(feedback);
        resource.touch();
        return repository.save(resource);
    }

    public List<Resource> listMine(Long contributorId) {
        return repository.findByContributorIdOrderByUpdatedAtDesc(contributorId);
    }

    public List<ResourceDraftListItem> listDrafts(Long contributorId) {
        List<Resource> resources = repository.findByContributorIdAndStatusInOrderByUpdatedAtDesc(
                contributorId, List.of(ResourceStatus.DRAFT, ResourceStatus.REJECTED));
        List<Long> categoryIds = resources.stream()
                .map(Resource::getCategoryId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, Category> categoriesById = new HashMap<>();
        if (!categoryIds.isEmpty()) {
            for (Category c : categoryRepository.findAllById(categoryIds)) {
                categoriesById.put(c.getId(), c);
            }
        }
        List<ResourceDraftListItem> result = new ArrayList<>();
        for (Resource r : resources) {
            List<ResourceMedia> media = mediaRepository.findByResourceIdOrderBySortOrderAsc(r.getId());
            String feedbackDisplay = resolveReviewFeedbackForContributor(r);
            Category cat = r.getCategoryId() != null ? categoriesById.get(r.getCategoryId()) : null;
            result.add(ResourceDraftListItem.from(r, media, feedbackDisplay, cat));
        }
        return result;
    }

    /** 草稿/打回相关入口需要关注的数量（Drafts 红点） */
    public long countDraftAttentionForContributor(Long contributorId) {
        return repository.countByContributorIdAndStatus(contributorId, ResourceStatus.REJECTED);
    }

    /** 个人状态更新数量（Profile/头像红点） */
    public long countStatusNoticesForContributor(Long contributorId) {
        return repository.countByContributorIdAndStatus(contributorId, ResourceStatus.APPROVED)
                + countDraftAttentionForContributor(contributorId);
    }

    /**
     * Module C 拒绝时若尚未写入 resources.review_feedback，则从 review_feedback 表取最新一条拒绝原因。
     */
    private String resolveReviewFeedbackForContributor(Resource r) {
        if (r.getReviewFeedback() != null && !r.getReviewFeedback().isBlank()) {
            return null;
        }
        if (r.getStatus() != ResourceStatus.REJECTED) {
            return null;
        }
        return reviewFeedbackRepository
                .findFirstByResourceIdAndDecisionOrderByReviewedAtDesc(r.getId(), ReviewDecision.REJECTED)
                .map(fb -> fb.getFeedbackText())
                .orElse(null);
    }

    public List<Resource> listPending() {
        return repository.findByStatusOrderByUpdatedAtDesc(ResourceStatus.PENDING_REVIEW);
    }

    public List<Resource> listApproved() {
        return repository.findByStatusOrderByUpdatedAtDesc(ResourceStatus.APPROVED);
    }

    @Transactional
    public void deleteDraft(Long resourceId, Long contributorId) {
        Resource resource = mustBeOwner(resourceId, contributorId);
        if (resource.getStatus() != ResourceStatus.DRAFT) {
            throw new IllegalStateException("仅草稿可删除");
        }
        repository.delete(resource);
    }

    public Map<String, Object> options() {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> categoryOptions = new ArrayList<>();
        for (Category c : categoryRepository.findAllByStatusOrderByNameAsc(CategoryStatus.ACTIVE)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", c.getId());
            row.put("name", c.getName());
            categoryOptions.add(row);
        }
        result.put("categories", categoryOptions);
        result.put("places", PLACES);
        result.put("recommendedTags", RECOMMENDED_TAGS);
        result.put("copyrightOptions", COPYRIGHT_OPTIONS);
        result.put("titleMaxLength", TITLE_MAX_LENGTH);
        result.put("descriptionMaxLength", DESCRIPTION_MAX_LENGTH);
        result.put("allowedFileExtensions", ALLOWED_FILE_EXTENSIONS);
        result.put("maxFiles", MAX_FILES);
        result.put("maxFileSizeBytes", MAX_FILE_BYTES);
        result.put("chinaCities", buildChinaCities());
        return result;
    }

    // ---------- private helpers ----------

    private Resource mustBeOwner(Long resourceId, Long contributorId) {
        Resource resource = repository.findById(resourceId)
                .orElseThrow(() -> new IllegalArgumentException("资源不存在"));
        if (!Objects.equals(resource.getContributorId(), contributorId)) {
            throw new IllegalStateException("只能操作自己创建的资源");
        }
        return resource;
    }

    private void ensureEditable(Resource resource) {
        if (!(resource.getStatus() == ResourceStatus.DRAFT ||
              resource.getStatus() == ResourceStatus.REJECTED)) {
            throw new IllegalStateException("仅草稿和已拒绝资源可编辑");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void applyMetadata(Resource resource, ResourceRequest payload) {
        if (payload == null) return;
        applyCategoryFields(resource, payload.getCategoryId());
        validatePlace(payload.getPlace());
        validateChoice(payload.getCopyrightDeclaration(), COPYRIGHT_OPTIONS, "版权声明");
        validateExternalLinks(payload.getExternalLinks());
        if (!isBlank(payload.getTitle()) && payload.getTitle().length() > TITLE_MAX_LENGTH) {
            throw new IllegalStateException("标题不能超过30字");
        }
        if (!isBlank(payload.getDescription()) && payload.getDescription().length() > DESCRIPTION_MAX_LENGTH) {
            throw new IllegalStateException("描述不能超过2000字");
        }
        resource.setTitle(payload.getTitle());
        resource.setPlace(payload.getPlace());
        resource.setDescription(payload.getDescription());
        resource.setTags(payload.getTags());
        resource.setCopyrightDeclaration(payload.getCopyrightDeclaration());
        if (payload.getExternalLinks() != null && !payload.getExternalLinks().isEmpty()) {
            String joined = payload.getExternalLinks().stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .reduce((a, b) -> a + "," + b)
                .orElse(null);
            resource.setExternalLink(joined);
        } else {
            resource.setExternalLink(null);
        }
        syncResourceTags(resource, payload.getTags());
    }

    /**
     * 写入 category_id 与冗余的 category 名称；停用中的分类仍允许保存到草稿以便修改。
     */
    private void applyCategoryFields(Resource resource, Long categoryId) {
        if (categoryId == null) {
            resource.setCategoryId(null);
            resource.setCategory(null);
            return;
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalStateException("分类不存在"));
        resource.setCategoryId(category.getId());
        resource.setCategory(category.getName());
    }

    private void validateChoice(String value, List<String> options, String fieldName) {
        if (!isBlank(value) && !options.contains(value)) {
            throw new IllegalStateException(fieldName + "不在可选范围内");
        }
    }

    private void validatePlace(String value) {
        if (isBlank(value)) return;
        if (cityRepository.existsByCity(value)) return;
        if (PLACES.contains(value)) return;
        throw new IllegalStateException("地点不在可选范围内");
    }

    private void validateExternalLinks(List<String> externalLinks) {
        if (externalLinks == null || externalLinks.isEmpty()) return;
        for (String link : externalLinks) {
            if (isBlank(link)) continue;
            String value = link.trim();
            if (!(value.startsWith("http://") || value.startsWith("https://"))) {
                throw new IllegalStateException("外部链接需以 http 或 https 开头");
            }
        }
    }

    private void syncResourceTags(Resource resource, String tagInput) {
        Long resourceId = resource.getId();
        if (resourceId == null) return;

        clearResourceTags(resourceId);

        List<String> tagNames = parseTagNames(tagInput);
        if (tagNames.isEmpty()) return;

        for (String name : tagNames) {
            Tag tag = tagRepository.findByNameIgnoreCase(name).orElse(null);
            if (tag == null) {
                tag = new Tag();
                tag.setName(name);
                tag.setIsDeleted(false);
                tag = tagRepository.save(tag);
            } else if (Boolean.TRUE.equals(tag.getIsDeleted())) {
                tag.setIsDeleted(false);
                tag = tagRepository.save(tag);
            }
            insertResourceTag(resourceId, tag.getId());
        }
    }

    private List<String> parseTagNames(String input) {
        if (isBlank(input)) return Collections.emptyList();
        String[] parts = input.trim().split("\\s+");
        List<String> result = new ArrayList<>();
        for (String part : parts) {
            String value = part.trim();
            if (value.isEmpty()) continue;
            if (value.startsWith("#")) {
                value = value.substring(1).trim();
            }
            if (!value.isEmpty()) result.add(value);
        }
        return result.stream()
                .map(String::trim)
                .filter(v -> !v.isEmpty())
                .distinct()
                .toList();
    }

    private void clearResourceTags(Long resourceId) {
        entityManager.createNativeQuery("DELETE FROM resource_tags WHERE resource_id = :resourceId")
                .setParameter("resourceId", resourceId)
                .executeUpdate();
    }

    private void insertResourceTag(Long resourceId, Long tagId) {
        entityManager.createNativeQuery("INSERT INTO resource_tags (resource_id, tag_id) VALUES (:resourceId, :tagId)")
                .setParameter("resourceId", resourceId)
                .setParameter("tagId", tagId)
                .executeUpdate();
    }

    private Map<String, List<String>> buildChinaCities() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        List<ChinaCity> rows = cityRepository.findAll();
        rows.sort(Comparator.comparing(ChinaCity::getProvince).thenComparing(ChinaCity::getCity));
        for (ChinaCity row : rows) {
            result.computeIfAbsent(row.getProvince(), key -> new ArrayList<>()).add(row.getCity());
        }
        return result;
    }

    private void validateFileType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        boolean allowed = ALLOWED_FILE_EXTENSIONS.stream().anyMatch(lower::endsWith);
        if (!allowed) {
            throw new IllegalStateException("文件类型仅支持 docx、pdf、txt、png、jpg、jpeg、mov、mp3");
        }
    }

    private MediaType resolveMediaType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.DETAIL;
        if (lower.endsWith(".mov")) return MediaType.VIDEO;
        if (lower.endsWith(".mp3")) return MediaType.AUDIO;
        return MediaType.DOCUMENT;
    }
}
