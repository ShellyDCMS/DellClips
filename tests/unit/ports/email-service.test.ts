import type { EmailService } from "@/lib/ports/email-service";
import sinon from "sinon";
import { StubbedInstanceCreator } from "ts-stubber";
import { beforeEach, describe, expect, it } from "vitest";

describe("EmailService Port (interface contract via ts-stubber)", () => {
  let service: EmailService;

  beforeEach(() => {
    // given
    service = StubbedInstanceCreator<EmailService, sinon.SinonStub>(() =>
      sinon.stub()
    ).createStubbedInstance();
  });

  describe("given a stubbed EmailService", () => {
    describe("when sending a verification code", () => {
      it("then it should accept email and code parameters", async () => {
        // given
        (service.sendVerificationCode as sinon.SinonStub).resolves(undefined);

        // when
        await service.sendVerificationCode("user@dell.com", "123456");

        // then
        expect(
          (service.sendVerificationCode as sinon.SinonStub).calledOnceWith(
            "user@dell.com",
            "123456"
          )
        ).toBe(true);
      });

      it("then it should resolve without returning a value", async () => {
        // given
        (service.sendVerificationCode as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.sendVerificationCode("user@dell.com", "654321")
        ).resolves.toBeUndefined();
      });
    });
  });
});
