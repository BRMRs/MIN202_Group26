package com.group26.heritage.module_d.controller;

import com.group26.heritage.common.dto.PageResult;
import com.group26.heritage.module_d.dto.CategoryOptionDto;
import com.group26.heritage.module_d.dto.ResourceDetailDto;
import com.group26.heritage.module_d.dto.ResourceSummaryDto;
import com.group26.heritage.module_d.dto.TagOptionDto;
import com.group26.heritage.module_d.service.DiscoverMediaService;
import com.group26.heritage.module_d.service.SearchService;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Discover Controller — Module D
 * Summary D-PBI 1 (Browse), D-PBI 2 (Search), D-PBI 3 (Filter), D-PBI 4 (Detail)
 */
@RestController
@RequestMapping("/api/discover")
public class DiscoverController {
    private final SearchService searchService;
    private final DiscoverMediaService discoverMediaService;

    public DiscoverController(SearchService searchService, DiscoverMediaService discoverMediaService) {
        this.searchService = searchService;
        this.discoverMediaService = discoverMediaService;
    }

    @GetMapping("/resources")
    public PageResult<ResourceSummaryDto> listResources(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(required = false) String place,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        return searchService.searchAndFilter(keyword, categoryId, tagIds, place, page, size, sortBy, direction);
    }

    @GetMapping("/resources/search")
    public PageResult<ResourceSummaryDto> searchResources(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        return searchService.searchByKeyword(keyword, page, size, sortBy, direction);
    }

    @GetMapping("/resources/filter")
    public PageResult<ResourceSummaryDto> filterResources(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<Long> tagIds,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String direction
    ) {
        return searchService.filterByCategoryAndTags(categoryId, tagIds, page, size, sortBy, direction);
    }

    @GetMapping("/resources/{id}")
    public ResourceDetailDto getResourceDetail(@PathVariable("id") Long id) {
        return searchService.getResourceDetail(id);
    }

    /** Public binary for a media row (parent resource must be APPROVED or ARCHIVED). */
    @GetMapping("/media/{mediaId}")
    public ResponseEntity<Resource> getPublicMedia(@PathVariable("mediaId") Long mediaId) {
        return discoverMediaService.servePublicMedia(mediaId);
    }

    @GetMapping("/categories")
    public List<CategoryOptionDto> listCategories() {
        return searchService.listCategories();
    }

    @GetMapping("/tags")
    public List<TagOptionDto> listTags() {
        return searchService.listTags();
    }

    /** Distinct place strings from approved resources (for search filters). */
    @GetMapping("/places")
    public List<String> listPlaces() {
        return searchService.listDistinctPlaces();
    }
}
