package com.pwa.energy.service;

import com.pwa.energy.entity.LogEntry;
import com.pwa.energy.repository.LogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LogService {
    @Autowired
    private LogRepository logRepository;

    public LogEntry saveLog(LogEntry logEntry) {
        return logRepository.save(logEntry);
    }

    public List<LogEntry> getAllLogs() {
        return logRepository.findAll();
    }

    public void clearLogs() {
        logRepository.deleteAll();
    }
}
