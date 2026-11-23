
package com.atlasone.api.bootstrap;

import com.atlasone.api.organization.entity.Organization;
import com.atlasone.api.organization.repository.OrganizationRepository;
import com.atlasone.api.user.entity.AppUser;
import com.atlasone.api.user.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;

@Component
public class InitialAdminBootstrap implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(InitialAdminBootstrap.class);

    private final OrganizationRepository organizationRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${atlasone.bootstrap.enabled:false}")
    private boolean enabled;

    @Value("${atlasone.bootstrap.organization-name:}")
    private String organizationName;

    @Value("${atlasone.bootstrap.organization-slug:}")
    private String organizationSlug;

    @Value("${atlasone.bootstrap.admin-name:}")
    private String adminName;

    @Value("${atlasone.bootstrap.admin-email:}")
    private String adminEmail;

    @Value("${atlasone.bootstrap.admin-password:}")
    private String adminPassword;

    public InitialAdminBootstrap(
            OrganizationRepository organizationRepository,
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.organizationRepository = organizationRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {

        if (!enabled) {
            log.info("Cadastro inicial desativado.");
            return;
        }

        long organizationsCount = organizationRepository.count();
        long usersCount = appUserRepository.count();

        if (organizationsCount > 0 || usersCount > 0) {
            log.warn(
                    "Cadastro inicial ignorado: o banco já possui organizações ou usuários."
            );
            return;
        }

        validateConfiguration();

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Organization organization = new Organization(
                organizationName.trim(),
                organizationSlug.trim().toLowerCase(Locale.ROOT),
                "active",
                now,
                now
        );

        Organization savedOrganization =
                organizationRepository.save(organization);

        AppUser admin = new AppUser(
                savedOrganization.getId(),
                adminName.trim(),
                adminEmail.trim().toLowerCase(Locale.ROOT),
                "admin",
                "active",
                passwordEncoder.encode(adminPassword),
                now,
                now
        );

        appUserRepository.save(admin);

        log.info("Organização inicial criada com sucesso.");
        log.info("Administrador inicial criado com sucesso.");
    }

    private void validateConfiguration() {

        if (!StringUtils.hasText(organizationName)
                || !StringUtils.hasText(organizationSlug)
                || !StringUtils.hasText(adminName)
                || !StringUtils.hasText(adminEmail)
                || !StringUtils.hasText(adminPassword)) {

            throw new IllegalStateException(
                    "Configuração incompleta para o cadastro inicial."
            );
        }

        if (adminPassword.length() < 12) {
            throw new IllegalStateException(
                    "A senha do administrador deve possuir pelo menos 12 caracteres."
            );
        }

        if (adminEmail.length() > 255
                || organizationName.length() > 150
                || organizationSlug.length() > 80
                || adminName.length() > 150) {

            throw new IllegalStateException(
                    "Um dos campos do cadastro inicial excede o limite permitido."
            );
        }
    }
}
