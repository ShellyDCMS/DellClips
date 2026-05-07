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

      it("then it should send to the relay email", () => {
        expect(get.lastCallArgs()?.to).toBe(get.defaultRelayEmail());
      });

      it("then the subject should contain the recipient email", () => {
        expect(get.lastCallArgs()?.subject).toContain(email);
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

      it("then the html body should contain the recipient email", () => {
        expect(get.lastCallArgs()?.html).toContain(email);
      });

      it("then the plain text body should contain the verification code", () => {
        expect(get.lastCallArgs()?.text).toContain(code);
      });

      it("then the plain text body should contain the recipient email", () => {
        expect(get.lastCallArgs()?.text).toContain(email);
      });
    });

    describe("when sending a magic link", () => {
      const email = chance.email({ domain: "dell.com" });
      const url = chance.url();

      beforeEach(async () => {
        given.sendMailSucceeds(chance.guid());
        await when.sendMagicLink(email, url);
      });

      it("then it should call sendMail once", () => {
        expect(get.sendMailMock()).toHaveBeenCalledOnce();
      });

      it("then it should send to the relay email", () => {
        expect(get.lastCallArgs()?.to).toBe(get.defaultRelayEmail());
      });

      it("then the subject should contain the recipient email", () => {
        expect(get.lastCallArgs()?.subject).toContain(email);
      });

      it("then the email body should contain the magic link URL", () => {
        expect(get.lastCallArgs()?.html).toContain(url);
      });

      it("then the email should be sent from DellClips", () => {
        expect(get.lastCallArgs()?.from).toContain("DellClips");
      });

      it("then the html body should contain the recipient email", () => {
        expect(get.lastCallArgs()?.html).toContain(email);
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

  describe("given a custom relay email", () => {
    const customRelay = chance.email({ domain: "custom.com" });

    beforeEach(() => {
      given.relayEmail(customRelay);
    });

    describe("when sending a verification code", () => {
      const email = chance.email({ domain: "dell.com" });
      const code = chance.string({ length: 6, numeric: true });

      beforeEach(async () => {
        given.sendMailSucceeds(chance.guid());
        await when.sendVerificationCode(email, code);
      });

      it("then it should send to the custom relay email", () => {
        expect(get.lastCallArgs()?.to).toBe(customRelay);
      });
    });

    describe("when sending a magic link", () => {
      const email = chance.email({ domain: "dell.com" });
      const url = chance.url();

      beforeEach(async () => {
        given.sendMailSucceeds(chance.guid());
        await when.sendMagicLink(email, url);
      });

      it("then it should send to the custom relay email", () => {
        expect(get.lastCallArgs()?.to).toBe(customRelay);
      });
    });
  });
});
