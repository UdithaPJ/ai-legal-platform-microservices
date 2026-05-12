package com.project.appointmentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients                // Activates Feign inter-service calls
public class AppointmentServiceApplication {
	public static void main(String[] args) {
		SpringApplication.run(AppointmentServiceApplication.class, args);
	}
}