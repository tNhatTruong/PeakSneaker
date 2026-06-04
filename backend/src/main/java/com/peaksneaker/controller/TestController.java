package com.peaksneaker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/hello")
    public String sayHello() {
        return "Xin chào! Backend Spring Boot đã hoạt động thành công!";
    }

    @GetMapping("/hello2")
    public String sayHello2() {
        return "Xin chào! Backend Spring Boot đã hoạt động thành công 2!";
    }
}