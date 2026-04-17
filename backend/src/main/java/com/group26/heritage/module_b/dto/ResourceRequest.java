package com.group26.heritage.module_b.dto;

import java.util.List;

public class ResourceRequest {
    private String title;
    /** 对应 categories 表主键；贡献者从 /api/resources/options 中启用中的分类选择 */
    private Long categoryId;
    private String place;
    private String description;
    private String tags;
    private String copyrightDeclaration;
    private List<String> externalLinks;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getCopyrightDeclaration() { return copyrightDeclaration; }
    public void setCopyrightDeclaration(String copyrightDeclaration) { this.copyrightDeclaration = copyrightDeclaration; }
    public List<String> getExternalLinks() { return externalLinks; }
    public void setExternalLinks(List<String> externalLinks) { this.externalLinks = externalLinks; }
}