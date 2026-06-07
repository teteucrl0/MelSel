package com.mellsell.realtime;

import com.mellsell.realtime.dto.ApiaryEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApiaryOnboardingService {

    private final RealtimeBroadcastService broadcastService;

    @Async
    public void broadcastVendorOnboarding(String vendorName, String storeName) {
        String displayStore = (storeName != null && !storeName.isBlank()) ? storeName : "Apiário " + vendorName;
        Step[] steps = {
                new Step("welcome", "Bem-vindo à MelSell", vendorName + " está criando a loja \"" + displayStore + "\"", 15),
                new Step("validate", "Validando cadastro", "Confirmando dados do apicultor...", 35),
                new Step("profile", "Perfil da loja", "Configurando vitrine e identidade da marca...", 55),
                new Step("apiary", "Montando apiário digital", "Preparando colmeias virtuais e catálogo...", 78),
                new Step("ready", "Apiário ativo", displayStore + " já pode receber pedidos na plataforma!", 100),
        };

        for (int i = 0; i < steps.length; i++) {
            Step step = steps[i];
            boolean last = i == steps.length - 1;
            broadcastService.broadcastApiaryStep(ApiaryEventDTO.builder()
                    .stepId(step.id)
                    .title(step.title)
                    .message(step.message)
                    .progress(step.progress)
                    .storeName(displayStore)
                    .vendorName(vendorName)
                    .completed(last)
                    .build());
            if (!last) {
                sleep(900);
            }
        }
    }

    private void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private record Step(String id, String title, String message, int progress) {}
}