package com.pwa.energy.controller;

import com.pwa.energy.entity.LogEntry;
import com.pwa.energy.service.LogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class LogController {
    @Autowired
    private LogService logService;

    @GetMapping("/")
    public String welcome() {
        return "Energy-Aware PWA API is running!";
    }

    @PostMapping("/logs")
    public LogEntry saveLog(@RequestBody LogEntry logEntry) {
        return logService.saveLog(logEntry);
    }

    @GetMapping("/logs")
    public List<LogEntry> getAllLogs() {
        return logService.getAllLogs();
    }

    @DeleteMapping("/logs")
    public void clearLogs() {
        logService.clearLogs();
    }

    @GetMapping("/content")
    public List<Map<String, String>> getContent(@RequestParam(defaultValue = "0") int page, @RequestParam(required = false) String category) {
        List<Map<String, String>> content = new ArrayList<>();
        String[] categories = {"Tech", "Business", "AI"};
        
        for (int i = 0; i < 10; i++) {
            int id = page * 10 + i;
            String cat = category != null ? category : categories[id % 3];
            content.add(Map.of(
                "id", String.valueOf(id),
                "title", cat + " Update #" + id,
                "description", "This is a detailed description for the " + cat + " article number " + id + ". It covers various aspects of modern energy-aware systems.",
                "category", cat,
                "image", "https://via.placeholder.com/300x200?text=" + cat + "+" + id
            ));
        }
        return content;
    }
}
