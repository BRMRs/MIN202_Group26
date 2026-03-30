package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByContributorIdOrderByUpdatedAtDesc(Long contributorId);
    List<Resource> findByContributorIdAndStatusInOrderByUpdatedAtDesc(Long contributorId, List<ResourceStatus> statuses);
    List<Resource> findByStatusOrderByUpdatedAtDesc(ResourceStatus status);
}
