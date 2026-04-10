package com.group26.heritage.common.repository;

import com.group26.heritage.entity.ChinaCity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChinaCityRepository extends JpaRepository<ChinaCity, Long> {
    boolean existsByCity(String city);
}
