package com.group26.heritage.module_d.dto;

import com.group26.heritage.common.dto.UserSummaryDto;
import com.group26.heritage.entity.enums.ResourceStatus;

import java.time.LocalDateTime;
import java.util.List;

public class ResourceDetailDto {
    private Long id;
    private String title;
    private String description;
    private Long categoryId;
    private String categoryName;
    private UserSummaryDto contributor;
    private ResourceStatus status;
    private String place;
    private String copyrightDeclaration;
    private String externalLink;
    private String fileUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer commentCount;
    private Integer likeCount;
    private List<MediaDto> media;
    private List<TagOptionDto> tags;

    public ResourceDetailDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public UserSummaryDto getContributor() { return contributor; }
    public void setContributor(UserSummaryDto contributor) { this.contributor = contributor; }
    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }
    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
    public String getCopyrightDeclaration() { return copyrightDeclaration; }
    public void setCopyrightDeclaration(String copyrightDeclaration) { this.copyrightDeclaration = copyrightDeclaration; }
    public String getExternalLink() { return externalLink; }
    public void setExternalLink(String externalLink) { this.externalLink = externalLink; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Integer getCommentCount() { return commentCount; }
    public void setCommentCount(Integer commentCount) { this.commentCount = commentCount; }
    public Integer getLikeCount() { return likeCount; }
    public void setLikeCount(Integer likeCount) { this.likeCount = likeCount; }
    public List<MediaDto> getMedia() { return media; }
    public void setMedia(List<MediaDto> media) { this.media = media; }
    public List<TagOptionDto> getTags() { return tags; }
    public void setTags(List<TagOptionDto> tags) { this.tags = tags; }

    public static class MediaDto {
        private Long id;
        private String mediaType;
        private String fileUrl;
        private String fileName;

        public MediaDto() {}
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getMediaType() { return mediaType; }
        public void setMediaType(String mediaType) { this.mediaType = mediaType; }
        public String getFileUrl() { return fileUrl; }
        public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
    }

    public static ResourceDetailDtoBuilder builder() {
        return new ResourceDetailDtoBuilder();
    }

    public static class ResourceDetailDtoBuilder {
        private final ResourceDetailDto dto = new ResourceDetailDto();
        public ResourceDetailDtoBuilder id(Long id) { dto.setId(id); return this; }
        public ResourceDetailDtoBuilder title(String title) { dto.setTitle(title); return this; }
        public ResourceDetailDtoBuilder description(String description) { dto.setDescription(description); return this; }
        public ResourceDetailDtoBuilder categoryId(Long categoryId) { dto.setCategoryId(categoryId); return this; }
        public ResourceDetailDtoBuilder categoryName(String categoryName) { dto.setCategoryName(categoryName); return this; }
        public ResourceDetailDtoBuilder contributor(UserSummaryDto contributor) { dto.setContributor(contributor); return this; }
        public ResourceDetailDtoBuilder status(ResourceStatus status) { dto.setStatus(status); return this; }
        public ResourceDetailDtoBuilder place(String place) { dto.setPlace(place); return this; }
        public ResourceDetailDtoBuilder copyrightDeclaration(String copyrightDeclaration) { dto.setCopyrightDeclaration(copyrightDeclaration); return this; }
        public ResourceDetailDtoBuilder externalLink(String externalLink) { dto.setExternalLink(externalLink); return this; }
        public ResourceDetailDtoBuilder fileUrl(String fileUrl) { dto.setFileUrl(fileUrl); return this; }
        public ResourceDetailDtoBuilder createdAt(LocalDateTime createdAt) { dto.setCreatedAt(createdAt); return this; }
        public ResourceDetailDtoBuilder updatedAt(LocalDateTime updatedAt) { dto.setUpdatedAt(updatedAt); return this; }
        public ResourceDetailDtoBuilder commentCount(Integer commentCount) { dto.setCommentCount(commentCount); return this; }
        public ResourceDetailDtoBuilder likeCount(Integer likeCount) { dto.setLikeCount(likeCount); return this; }
        public ResourceDetailDtoBuilder media(List<MediaDto> media) { dto.setMedia(media); return this; }
        public ResourceDetailDtoBuilder tags(List<TagOptionDto> tags) { dto.setTags(tags); return this; }
        public ResourceDetailDto build() { return dto; }
    }
}
