
package com.atlasone.api.customer.service;

import com.atlasone.api.customer.entity.Customer;
import com.atlasone.api.customer.repository.CustomerRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<Customer> findAll(UUID organizationId) {
        return customerRepository
                .findAllByOrganizationIdOrderByNameAsc(organizationId);
    }

    @Transactional(readOnly = true)
    public Customer findById(UUID organizationId, UUID customerId) {
        return customerRepository
                .findByOrganizationIdAndId(organizationId, customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
    }

    public Customer create(UUID organizationId, Customer customer) {

        customer.setOrganizationId(organizationId);

        String document = normalizeDocument(customer.getDocument());

        if (document != null &&
                customerRepository
                        .findByOrganizationIdAndDocument(organizationId, document)
                        .isPresent()) {
            throw new IllegalArgumentException(
                    "Já existe um cliente com este documento.");
        }

        customer.setDocument(document);

        if (customer.getStatus() == null || customer.getStatus().isBlank()) {
            customer.setStatus("active");
        }

        return customerRepository.save(customer);
    }

    public Customer update(
            UUID organizationId,
            UUID customerId,
            Customer updatedCustomer) {

        Customer customer = findById(organizationId, customerId);

        String document = normalizeDocument(updatedCustomer.getDocument());

        if (document != null) {
            customerRepository
                    .findByOrganizationIdAndDocument(organizationId, document)
                    .filter(existing -> !existing.getId().equals(customerId))
                    .ifPresent(existing -> {
                        throw new IllegalArgumentException(
                                "Já existe outro cliente com este documento.");
                    });
        }

        customer.setName(updatedCustomer.getName());
        customer.setDocument(document);
        customer.setPhone(updatedCustomer.getPhone());
        customer.setEmail(updatedCustomer.getEmail());
        customer.setNotes(updatedCustomer.getNotes());

        return customerRepository.save(customer);
    }

    private String normalizeDocument(String document) {
        if (document == null || document.isBlank()) {
            return null;
        }

        return document.replaceAll("[^0-9]", "");
    }
}
