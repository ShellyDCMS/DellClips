import type { EmailService } from "@/lib/ports/email-service";
import sinon from "sinon";
import { StubbedInstanceCreator } from "ts-stubber";
import { beforeEach, describe, expect, it } from "vitest";

describe("EmailService Port (interface contract via ts-stubber)", () => {
  let service: EmailService;

  beforeEach(() => {
    // given
    service = StubbedInstanceCreator<EmailService, sinon.SinonStub>(
      () => sinon.stub(),
    ).createStubbedInstance();
  });

  describe("given a stubbed EmailService", () => {
    describe("when sending a magic link", () => {
      it("then it should accept email and url parameters", async () => {
        // given
        (service.sendMagicLink as sinon.SinonStub).resolves(undefined);

        // when
        await service.sendMagicLink("user@dell.com", "https://app.com/verify?token=abc");

        // then
        expect(
          (service.sendMagicLink as sinon.SinonStub).calledOnceWith(
            "user@dell.com",
            "https://app.com/verify?token=abc"
          )
        ).toBe(true);
      });

      it("then it should resolve without returning a value", async () => {
        // given
        (service.sendMagicLink as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.sendMagicLink("user@dell.com", "https://link")
        ).resolves.toBeUndefined();
      });
    });
  });
});
