
package com.atlasone.api.customer.controller;

import com.atlasone.api.customer.entity.Customer;
import com.atlasone.api.customer.service.CustomerService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public List<Customer> findAll(
            @AuthenticationPrincipal Jwt jwt) {
        UUID organizationId = getOrganizationId(jwt);

        return customerService.findAll(organizationId);
    }

    @GetMapping("/{id}")
    public Customer findById(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt) {
        UUID organizationId = getOrganizationId(jwt);

        return customerService.findById(organizationId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Customer create(
            @RequestBody Customer customer,
            @AuthenticationPrincipal Jwt jwt) {
        UUID organizationId = getOrganizationId(jwt);

        return customerService.create(organizationId, customer);
    }

    @PutMapping("/{id}")
    public Customer update(
            @PathVariable UUID id,
            @RequestBody Customer customer,
            @AuthenticationPrincipal Jwt jwt) {
        UUID organizationId = getOrganizationId(jwt);

        return customerService.update(
                organizationId,
                id,
                customer);
    }

    private UUID getOrganizationId(Jwt jwt) {
        String organizationId = jwt.getClaimAsString("organization_id");

        if (organizationId == null || organizationId.isBlank()) {
            throw new IllegalArgumentException(
                    "Organização não encontrada no token.");
        }

        return UUID.fromString(organizationId);
    }
}
