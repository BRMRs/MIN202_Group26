package com.group26.heritage.config;

import com.group26.heritage.common.repository.CategoryRepository;
import com.group26.heritage.entity.Category;
import com.group26.heritage.entity.enums.CategoryStatus;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Insert preset heritage categories if not present.
 * Admin-created categories in Module E always use is_default = false.
 */
@Service
@Order(100)
public class DefaultCategoryBootstrap implements CommandLineRunner {

    private static final List<DefaultEntry> PRESET = List.of(
            new DefaultEntry("Traditional Craftsmanship", "Handmade techniques, traditional crafts, and related artifacts"),
            new DefaultEntry("Folk Customs", "Festivals, rituals, temple fairs, and life customs"),
            new DefaultEntry("Folk Literature & Oral History", "Myths, legends, epics, ballads, and oral traditions"),
            new DefaultEntry("Traditional Performing Arts", "Local opera, folk arts, traditional music and dance"),
            new DefaultEntry("Historic Architecture & Settlements", "Historic buildings, vernacular architecture, traditional villages, and cultural landscapes"),
            new DefaultEntry("Traditional Fine Arts", "Painting, paper-cutting, embroidery, carving, and visual arts"),
            new DefaultEntry("Traditional Sports & Games", "Martial arts, dragon boat, traditional board games, and folk games"),
            new DefaultEntry("Intangible Heritage Cuisine & Foodways", "Food-making techniques and related customs")
    );

    private final CategoryRepository categoryRepository;

    public DefaultCategoryBootstrap(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        for (DefaultEntry entry : PRESET) {
            if (categoryRepository.existsByNameIgnoreCase(entry.name)) {
                continue;
            }
            Category c = new Category();
            c.setName(entry.name);
            c.setDescription(entry.description);
            c.setStatus(CategoryStatus.ACTIVE);
            c.setDefaultFlag(true);
            categoryRepository.save(c);
        }
    }

    private record DefaultEntry(String name, String description) {
    }
}
