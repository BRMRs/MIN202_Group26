package com.group26.heritage.common.repository;

import com.group26.heritage.entity.ContributorApplicationFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContributorApplicationFileRepository extends JpaRepository<ContributorApplicationFile, Long> {
    List<ContributorApplicationFile> findByApplicationIdOrderBySortOrderAsc(Long applicationId);
}
