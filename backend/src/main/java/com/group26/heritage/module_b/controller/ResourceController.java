package com.group26.heritage.module_b.controller;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.UserRole;
import com.group26.heritage.module_b.dto.ResourceRequest;
import com.group26.heritage.module_b.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Module B: Resource Submission
 * API prefix: /api/resources/**
 *
 * Auth: uses X-User-Id and X-User-Role headers injected by Module A's security filter.
 * For standalone testing, set these headers manually.
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService service;

    public ResourceController(ResourceService service) {
        this.service = service;
    }

    // ---------- Contributor endpoints ----------

    @PostMapping
    public Resource createDraft(@RequestHeader("X-User-Id") Long userId,
                                @RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.createDraft(userId);
    }

    @PostMapping("/{id}/save-draft")
    public Resource saveDraft(@PathVariable Long id,
                              @RequestHeader("X-User-Id") Long userId,
                              @RequestHeader("X-User-Role") String role,
                              @RequestBody(required = false) ResourceRequest payload) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.saveDraft(id, userId, payload);
    }

    @PostMapping("/{id}/file")
    public Resource uploadFile(@PathVariable Long id,
                               @RequestHeader("X-User-Id") Long userId,
                               @RequestHeader("X-User-Role") String role,
                               @RequestParam("file") MultipartFile file) throws IOException {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.uploadFile(id, userId, file);
    }

    @PatchMapping("/{id}/external-link")
    public Resource externalLink(@PathVariable Long id,
                                 @RequestHeader("X-User-Id") Long userId,
                                 @RequestHeader("X-User-Role") String role,
                                 @RequestBody Map<String, String> body) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.updateExternalLink(id, userId, body.get("externalLink"));
    }

    @PostMapping("/{id}/submit")
    public Resource submit(@PathVariable Long id,
                           @RequestHeader("X-User-Id") Long userId,
                           @RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.submit(id, userId);
    }

    @GetMapping("/mine")
    public List<Resource> mine(@RequestHeader("X-User-Id") Long userId,
                               @RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.listMine(userId);
    }

    @GetMapping("/drafts")
    public List<Resource> drafts(@RequestHeader("X-User-Id") Long userId,
                                 @RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.listDrafts(userId);
    }

    @DeleteMapping("/{id}/draft")
    public Map<String, String> deleteDraft(@PathVariable Long id,
                                           @RequestHeader("X-User-Id") Long userId,
                                           @RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.CONTRIBUTOR);
        service.deleteDraft(id, userId);
        return Map.of("message", "草稿已删除");
    }

    @GetMapping("/options")
    public Map<String, Object> options(@RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.CONTRIBUTOR);
        return service.options();
    }

    // ---------- Admin endpoints ----------

    @PostMapping("/{id}/review")
    public Resource review(@PathVariable Long id,
                           @RequestHeader("X-User-Role") String role,
                           @RequestBody Map<String, Object> body) {
        requireRole(role, UserRole.ADMIN);
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String feedback = body.get("feedback") == null ? null : body.get("feedback").toString();
        return service.review(id, approved, feedback);
    }

    @GetMapping("/pending")
    public List<Resource> pending(@RequestHeader("X-User-Role") String role) {
        requireRole(role, UserRole.ADMIN);
        return service.listPending();
    }

    // ---------- Shared endpoints ----------

    @GetMapping("/approved")
    public List<Resource> approved(@RequestHeader("X-User-Role") String role) {
        UserRole r = UserRole.valueOf(role);
        if (r != UserRole.CONTRIBUTOR && r != UserRole.VIEWER) {
            throw new IllegalStateException("当前角色无权限");
        }
        return service.listApproved();
    }

    // ---------- Exception handler ----------

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handleBadRequest(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    // ---------- Helper ----------

    private void requireRole(String roleHeader, UserRole expected) {
        try {
            UserRole actual = UserRole.valueOf(roleHeader);
            if (actual != expected) {
                throw new IllegalStateException("当前角色无权限");
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("无效的角色: " + roleHeader);
        }
    }
}
