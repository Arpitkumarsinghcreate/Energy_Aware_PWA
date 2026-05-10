package com.pwa.energy.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class LogEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String mode;
    private Integer battery;
    private Integer requests;
    private Integer syncEvents;
    private Double avgLatency;
    private Double latency;
    private String network;
    private LocalDateTime timestamp;

    public LogEntry() {}

    public LogEntry(Long id, String mode, Integer battery, Integer requests, Integer syncEvents, Double avgLatency, Double latency, String network, LocalDateTime timestamp) {
        this.id = id;
        this.mode = mode;
        this.battery = battery;
        this.requests = requests;
        this.syncEvents = syncEvents;
        this.avgLatency = avgLatency;
        this.latency = latency;
        this.network = network;
        this.timestamp = timestamp;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public Integer getBattery() { return battery; }
    public void setBattery(Integer battery) { this.battery = battery; }
    public Integer getRequests() { return requests; }
    public void setRequests(Integer requests) { this.requests = requests; }
    public Integer getSyncEvents() { return syncEvents; }
    public void setSyncEvents(Integer syncEvents) { this.syncEvents = syncEvents; }
    public Double getAvgLatency() { return avgLatency; }
    public void setAvgLatency(Double avgLatency) { this.avgLatency = avgLatency; }
    public Double getLatency() { return latency; }
    public void setLatency(Double latency) { this.latency = latency; }
    public String getNetwork() { return network; }
    public void setNetwork(String network) { this.network = network; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
