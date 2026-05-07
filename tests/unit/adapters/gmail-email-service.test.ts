import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { GmailEmailServiceDriver } from "./gmail-email-service.driver";

const chance = new Chance();

describe("GmailEmailService", () => {
  const driver = new GmailEmailServiceDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given a valid Gmail configuration", () => {
    describe("when sending a verification code", () => {
      const email = chance.email({ domain: "dell.com" });
      const code = chance.string({ length: 6, numeric: true });

      beforeEach(async () => {
        given.sendMailSucceeds(chance.guid());
        await when.sendVerificationCode(email, code);
      });

      it("then it should call sendMail once", () => {
        expect(get.sendMailMock()).toHaveBeenCalledOnce();
      });

      it("then it should send to the correct recipient", () => {
        expect(get.lastCallArgs()?.to).toBe(email);
      });

      it("then the email body should contain the verification code", () => {
        expect(get.lastCallArgs()?.html).toContain(code);
      });

      it("then the email should be sent from DellClips", () => {
        expect(get.lastCallArgs()?.from).toContain("DellClips");
      });

      it("then the subject should contain the verification code", () => {
        expect(get.lastCallArgs()?.subject).toContain(code);
      });
    });

    describe("when nodemailer fails", () => {
      const errorMessage = chance.sentence({ words: 3 });

      beforeEach(async () => {
        given.sendMailFails(errorMessage);
        await when.sendVerificationCode(chance.email({ domain: "dell.com" }), "999999");
      });

      it("then it should propagate the error", () => {
        expect(get.lastError()?.message).toBe(errorMessage);
      });
    });
  });
});
