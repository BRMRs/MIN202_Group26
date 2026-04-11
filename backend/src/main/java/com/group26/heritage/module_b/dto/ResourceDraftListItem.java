package com.group26.heritage.module_b.dto;

import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.ResourceMedia;
import com.group26.heritage.entity.enums.ResourceStatus;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Draft list row: resource fields needed for editing plus uploaded media metadata.
 */
public class ResourceDraftListItem {

    private Long id;
    private String title;
    private String description;
    private Long categoryId;
    private String category;
    /** ACTIVE / INACTIVE，无分类时为 null */
    private String categoryStatus;
    private String place;
    private String tags;
    private String copyrightDeclaration;
    private String externalLink;
    private ResourceStatus status;
    private String reviewFeedback;
    private List<DraftMediaFileView> mediaFiles;

    public static ResourceDraftListItem from(Resource r, List<ResourceMedia> media) {
        return from(r, media, null, null);
    }

    /**
     * @param reviewFeedbackDisplay 若非 null 则优先使用（例如从 Module C 的 review_feedback 表回填）
     */
    public static ResourceDraftListItem from(Resource r, List<ResourceMedia> media, String reviewFeedbackDisplay) {
        return from(r, media, reviewFeedbackDisplay, null);
    }

    /**
     * @param category 若已解析则写入 categoryStatus，便于前端区分已停用分类
     */
    public static ResourceDraftListItem from(Resource r, List<ResourceMedia> media, String reviewFeedbackDisplay,
                                             Category category) {
        ResourceDraftListItem item = new ResourceDraftListItem();
        item.id = r.getId();
        item.title = r.getTitle();
        item.description = r.getDescription();
        item.categoryId = r.getCategoryId();
        item.category = r.getCategory();
        item.place = r.getPlace();
        item.tags = r.getTags();
        item.copyrightDeclaration = r.getCopyrightDeclaration();
        item.externalLink = r.getExternalLink();
        item.status = r.getStatus();
        item.reviewFeedback = reviewFeedbackDisplay != null ? reviewFeedbackDisplay : r.getReviewFeedback();
        item.mediaFiles = media == null ? List.of() : media.stream()
                .map(m -> new DraftMediaFileView(m.getFileUrl(), m.getFileName(), m.getFileSize()))
                .collect(Collectors.toList());
        if (category != null) {
            item.categoryStatus = category.getStatus().name();
            if (item.category == null || item.category.isBlank()) {
                item.category = category.getName();
            }
        } else if (r.getCategoryId() != null) {
            item.categoryStatus = "INACTIVE";
        }
        return item;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Long getCategoryId() { return categoryId; }
    public String getCategory() { return category; }
    public String getCategoryStatus() { return categoryStatus; }
    public String getPlace() { return place; }
    public String getTags() { return tags; }
    public String getCopyrightDeclaration() { return copyrightDeclaration; }
    public String getExternalLink() { return externalLink; }
    public ResourceStatus getStatus() { return status; }
    public String getReviewFeedback() { return reviewFeedback; }
    public List<DraftMediaFileView> getMediaFiles() { return mediaFiles; }
}
