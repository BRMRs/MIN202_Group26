package com.group26.heritage.module_b.controller;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.User;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_b.dto.ResourceRequest;
import com.group26.heritage.module_b.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService service;

    public ResourceController(ResourceService service) {
        this.service = service;
    }

    @PostMapping
    public Resource createDraft(@AuthenticationPrincipal User user) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.createDraft(user.getId());
    }

    @PostMapping("/{id}/save-draft")
    public Resource saveDraft(@PathVariable Long id,
                              @AuthenticationPrincipal User user,
                              @RequestBody(required = false) ResourceRequest payload) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.saveDraft(id, user.getId(), payload);
    }

    @PostMapping("/{id}/file")
    public Resource uploadFile(@PathVariable Long id,
                               @AuthenticationPrincipal User user,
                               @RequestParam("file") MultipartFile file) throws IOException {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.uploadFile(id, user.getId(), file);
    }

    @PatchMapping("/{id}/external-link")
    public Resource externalLink(@PathVariable Long id,
                                 @AuthenticationPrincipal User user,
                                 @RequestBody Map<String, String> body) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.updateExternalLink(id, user.getId(), body.get("externalLink"));
    }

    @PostMapping("/{id}/submit")
    public Resource submit(@PathVariable Long id,
                           @AuthenticationPrincipal User user) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.submit(id, user.getId());
    }

    @GetMapping("/mine")
    public List<Resource> mine(@AuthenticationPrincipal User user) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.listMine(user.getId());
    }

    @GetMapping("/drafts")
    public List<Resource> drafts(@AuthenticationPrincipal User user) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.listDrafts(user.getId());
    }

    @DeleteMapping("/{id}/draft")
    public Map<String, String> deleteDraft(@PathVariable Long id,
                                           @AuthenticationPrincipal User user) {
        requireRole(user, UserRole.CONTRIBUTOR);
        service.deleteDraft(id, user.getId());
        return Map.of("message", "Draft deleted");
    }

    @GetMapping("/options")
    public Map<String, Object> options(@AuthenticationPrincipal User user) {
        requireRole(user, UserRole.CONTRIBUTOR);
        return service.options();
    }

    @PostMapping("/{id}/review")
    public Resource review(@PathVariable Long id,
                           @AuthenticationPrincipal User user,
                           @RequestBody Map<String, Object> body) {
        requireRole(user, UserRole.ADMIN);
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String feedback = body.get("feedback") == null ? null : body.get("feedback").toString();
        return service.review(id, approved, feedback);
    }

    @GetMapping("/pending")
    public List<Resource> pending(@AuthenticationPrincipal User user) {
        requireRole(user, UserRole.ADMIN);
        return service.listPending();
    }

    @GetMapping("/approved")
    public List<Resource> approved(@AuthenticationPrincipal User user) {
        return service.listApproved();
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handle(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    private void requireRole(User user, UserRole expected) {
        if (user.getRole() != expected) {
            throw new IllegalStateException("Access denied: insufficient role");
        }
    }
}
