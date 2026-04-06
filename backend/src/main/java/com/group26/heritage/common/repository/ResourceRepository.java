package com.group26.heritage.common.repository;

import com.group26.heritage.entity.Resource;
import com.group26.heritage.entity.enums.ResourceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByContributorIdOrderByUpdatedAtDesc(Long contributorId);
    List<Resource> findByContributorIdAndStatusInOrderByUpdatedAtDesc(Long contributorId, List<ResourceStatus> statuses);
    List<Resource> findByStatusOrderByUpdatedAtDesc(ResourceStatus status);
}