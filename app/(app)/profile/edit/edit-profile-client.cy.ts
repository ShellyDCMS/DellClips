import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RenderFactory } from "@/components/__test-utils__/renderer";
import EditProfileClient from "./edit-profile-client";
import { EditProfileClientDriver } from "./edit-profile-client.driver";

const chance = new Chance();

describe("EditProfileClient", () => {
  const driver = new EditProfileClientDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  const mockPush = Cypress.sinon.stub();
  const mockBack = Cypress.sinon.stub();
  const mockRefresh = Cypress.sinon.stub();

  const mockRouter = {
    back: mockBack,
    forward: () => {},
    push: mockPush,
    replace: () => {},
    refresh: mockRefresh,
    prefetch: () => Promise.resolve(),
  };

  const mockUser = {
    id: chance.guid(),
    email: chance.email({ domain: "dell.com" }),
    name: chance.name(),
    image: null,
    bio: chance.sentence(),
    department: chance.word(),
    jobTitle: chance.word(),
  };

  beforeEach(() => {
    mockPush.reset();
    mockBack.reset();
    mockRefresh.reset();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: EditProfileClient,
        props: get.props() as any,
      }),
      wrappers: () => [{ type: AppRouterContext.Provider, props: { value: mockRouter } }],
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given a user with no avatar URL", () => {
    beforeEach(() => {
      given.user(mockUser);
      when.render();
    });

    it("then the edit profile container should be visible", () => {
      then(get.container()).shouldBeVisible();
    });

    it("then the title should display Edit Profile", () => {
      then(get.title()).shouldInclude("Edit Profile");
    });

    it("then the avatar initial should be visible", () => {
      then(get.avatarInitial()).shouldBeVisible();
    });

    it("then the avatar initial should display the first letter of the name", () => {
      then(get.avatarInitialText()).shouldEqual(mockUser.name.charAt(0).toUpperCase());
    });

    it("then the avatar preview should not exist", () => {
      then(get.avatarPreview()).shouldNotExist();
    });

    it("then the name input should contain the user's name", () => {
      then(get.nameInput()).shouldHaveValue(mockUser.name);
    });

    it("then the bio input should contain the user's bio", () => {
      then(get.bioInput()).shouldHaveValue(mockUser.bio);
    });

    it("then the department input should contain the user's department", () => {
      then(get.departmentInput()).shouldHaveValue(mockUser.department);
    });

    it("then the job title input should contain the user's job title", () => {
      then(get.jobTitleInput()).shouldHaveValue(mockUser.jobTitle);
    });

    it("then the save button should be visible", () => {
      then(get.saveButton()).shouldBeVisible();
    });

    it("then the cancel button should be visible", () => {
      then(get.cancelButton()).shouldBeVisible();
    });

    it("then the error message should not exist", () => {
      then(get.error()).shouldNotExist();
    });

    it("then the success message should not exist", () => {
      then(get.success()).shouldNotExist();
    });
  });

  describe("given a user with an avatar URL", () => {
    beforeEach(() => {
      given.user({ ...mockUser, image: "/avatar.png" });
      when.render();
    });

    it("then the avatar preview should be visible", () => {
      then(get.avatarPreview()).shouldBeVisible();
    });

    it("then the avatar initial should not exist", () => {
      then(get.avatarInitial()).shouldNotExist();
    });
  });

  describe("given a user with no name", () => {
    const email = "shelly@dell.com";

    beforeEach(() => {
      given.user({ ...mockUser, name: null, email });
      when.render();
    });

    it("then the avatar initial should display the first letter of the email", () => {
      then(get.avatarInitialText()).shouldEqual("S");
    });
  });

  describe("given the user clicks save without changes", () => {
    beforeEach(() => {
      given.user(mockUser);
      when.render();
      when.clickSave();
    });

    it("then an error message should indicate no changes", () => {
      then(get.errorText()).shouldInclude("No changes to save");
    });
  });

  describe("given the user changes their name and clicks save", () => {
    const newName = chance.name();

    beforeEach(() => {
      given.user(mockUser);
      given.interceptUpdateProfile();
      when.render();
      when.clearName();
      when.typeName(newName);
      when.clickSave();
    });

    it("then the success message should be visible", () => {
      then(get.successText()).shouldInclude("Profile updated!");
    });
  });

  describe("given the update request fails", () => {
    const errorMessage = chance.sentence({ words: 3 });

    beforeEach(() => {
      given.user(mockUser);
      given.interceptUpdateProfileFails(errorMessage);
      when.render();
      when.clearName();
      when.typeName(chance.name());
      when.clickSave();
    });

    it("then the error message should display the server error", () => {
      then(get.errorText()).shouldInclude(errorMessage);
    });
  });

  describe("given the user clicks cancel", () => {
    beforeEach(() => {
      given.user(mockUser);
      when.render();
      when.clickCancel();
    });

    it("then router.back should have been called", () => {
      then(mockBack).shouldHaveBeenCalled();
    });
  });
});
