package com.group26.heritage.module_b.controller;

import com.group26.heritage.common.AuthService;
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

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService service;
    private final AuthService authService;

    public ResourceController(ResourceService service, AuthService authService) {
        this.service = service;
        this.authService = authService;
    }

    @PostMapping
    public Resource createDraft(@RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.createDraft(authService.getUserId(token));
    }

    @PostMapping("/{id}/save-draft")
    public Resource saveDraft(@PathVariable Long id,
                              @RequestHeader("X-Auth-Token") String token,
                              @RequestBody(required = false) ResourceRequest payload) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.saveDraft(id, authService.getUserId(token), payload);
    }

    @PostMapping("/{id}/file")
    public Resource uploadFile(@PathVariable Long id,
                               @RequestHeader("X-Auth-Token") String token,
                               @RequestParam("file") MultipartFile file) throws IOException {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.uploadFile(id, authService.getUserId(token), file);
    }

    @PatchMapping("/{id}/external-link")
    public Resource externalLink(@PathVariable Long id,
                                 @RequestHeader("X-Auth-Token") String token,
                                 @RequestBody Map<String, String> body) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.updateExternalLink(id, authService.getUserId(token), body.get("externalLink"));
    }

    @PostMapping("/{id}/submit")
    public Resource submit(@PathVariable Long id,
                           @RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.submit(id, authService.getUserId(token));
    }

    @GetMapping("/mine")
    public List<Resource> mine(@RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.listMine(authService.getUserId(token));
    }

    @GetMapping("/drafts")
    public List<Resource> drafts(@RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.listDrafts(authService.getUserId(token));
    }

    @DeleteMapping("/{id}/draft")
    public Map<String, String> deleteDraft(@PathVariable Long id,
                                           @RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.CONTRIBUTOR);
        service.deleteDraft(id, authService.getUserId(token));
        return Map.of("message", "草稿已删除");
    }

    @GetMapping("/options")
    public Map<String, Object> options(@RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.CONTRIBUTOR);
        return service.options();
    }

    @PostMapping("/{id}/review")
    public Resource review(@PathVariable Long id,
                           @RequestHeader("X-Auth-Token") String token,
                           @RequestBody Map<String, Object> body) {
        requireRole(token, UserRole.ADMIN);
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String feedback = body.get("feedback") == null ? null : body.get("feedback").toString();
        return service.review(id, approved, feedback);
    }

    @GetMapping("/pending")
    public List<Resource> pending(@RequestHeader("X-Auth-Token") String token) {
        requireRole(token, UserRole.ADMIN);
        return service.listPending();
    }

    @GetMapping("/approved")
    public List<Resource> approved(@RequestHeader("X-Auth-Token") String token) {
        UserRole role = authService.getUserRole(token);
        if (role != UserRole.CONTRIBUTOR && role != UserRole.VIEWER)
            throw new IllegalStateException("当前角色无权限");
        return service.listApproved();
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<Map<String, String>> handle(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }

    private void requireRole(String token, UserRole expected) {
        UserRole actual = authService.getUserRole(token);
        if (actual != expected) throw new IllegalStateException("当前角色无权限");
    }
}