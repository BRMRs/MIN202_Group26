package com.group26.heritage.module_b.dto;

public class ResourceRequest {
    private String title;
    private String category;
    private String place;
    private String description;
    private String tags;
    private String copyrightDeclaration;
    private String externalLink;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getPlace() { return place; }
    public void setPlace(String place) { this.place = place; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getCopyrightDeclaration() { return copyrightDeclaration; }
    public void setCopyrightDeclaration(String copyrightDeclaration) { this.copyrightDeclaration = copyrightDeclaration; }
    public String getExternalLink() { return externalLink; }
    public void setExternalLink(String externalLink) { this.externalLink = externalLink; }
}