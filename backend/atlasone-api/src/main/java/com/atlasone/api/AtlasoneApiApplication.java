
package com.atlasone.api;

import com.atlasone.api.common.security.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class AtlasoneApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(AtlasoneApiApplication.class, args);
    }
}
