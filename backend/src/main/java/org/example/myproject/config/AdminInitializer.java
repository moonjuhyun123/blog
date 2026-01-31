package org.example.myproject.config;

import lombok.RequiredArgsConstructor;
import org.example.myproject.entity.user.User;
import org.example.myproject.entity.user.UserRole;
import org.example.myproject.repository.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.nickname:Admin}")
    private String adminNickname;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()
                || adminPassword == null || adminPassword.isBlank()) {
            return;
        }

        User admin = userRepository.findByEmail(adminEmail).orElseGet(() -> User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .displayName(adminNickname)
                .role(UserRole.ADMIN)
                .blocked(false)
                .build());

        boolean changed = false;
        if (admin.getRole() != UserRole.ADMIN) {
            admin.promoteToAdmin();
            changed = true;
        }
        if (!passwordEncoder.matches(adminPassword, admin.getPassword())) {
            admin.changePassword(passwordEncoder.encode(adminPassword));
            changed = true;
        }
        if (admin.isBlocked()) {
            admin.ensureActive();
            changed = true;
        }
        if (admin.getDisplayName() == null || admin.getDisplayName().isBlank()) {
            admin.changeDisplayName(adminNickname);
            changed = true;
        }

        if (admin.getId() == null) {
            userRepository.save(admin);
        } else if (changed) {
            userRepository.save(admin);
        }
    }
}
