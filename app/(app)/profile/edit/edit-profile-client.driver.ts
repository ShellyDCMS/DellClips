import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}

interface EditProfileClientDriverProps {
  user?: User;
}

export class EditProfileClientDriver extends BaseTestDriver<EditProfileClientDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    user: (user: User) => {
      this.props.user = user;
    },
    interceptUpdateProfile: () => {
      this.helper.given.interceptAndMockResponse({
        method: "PUT",
        url: "**/api/users/me",
        alias: "updateProfile",
        response: { body: { ok: true } },
      });
    },
    interceptUpdateProfileFails: (errorMessage: string) => {
      this.helper.given.interceptAndMockResponse({
        method: "PUT",
        url: "**/api/users/me",
        alias: "updateProfile",
        response: { statusCode: 400, body: { error: errorMessage } },
      });
    },
  };

  when = {
    ...this._when,
    clearName: () => this.helper.when.clear("name-input"),
    typeName: (value: string) => this.helper.when.type("name-input", value),
    typeBio: (value: string) => this.helper.when.type("bio-input", value),
    typeDepartment: (value: string) => this.helper.when.type("department-input", value),
    typeJobTitle: (value: string) => this.helper.when.type("job-title-input", value),
    clickSave: () => this.helper.when.click("save-button"),
    clickCancel: () => this.helper.when.click("cancel-button"),
    clickAvatar: () => this.helper.when.click("avatar-button"),
    waitForUpdate: () => this.helper.when.waitForResponse("updateProfile"),
  };

  get = {
    ...this._get,
    container: () => this.helper.get.elementByTestId("edit-profile"),
    title: () => this.helper.get.elementsText("edit-profile-title"),
    nameInput: () => this.helper.get.elementByTestId("name-input"),
    bioInput: () => this.helper.get.elementByTestId("bio-input"),
    departmentInput: () => this.helper.get.elementByTestId("department-input"),
    jobTitleInput: () => this.helper.get.elementByTestId("job-title-input"),
    saveButton: () => this.helper.get.elementByTestId("save-button"),
    cancelButton: () => this.helper.get.elementByTestId("cancel-button"),
    avatarButton: () => this.helper.get.elementByTestId("avatar-button"),
    avatarPreview: () => this.helper.get.elementByTestId("avatar-preview"),
    avatarInitial: () => this.helper.get.elementByTestId("avatar-initial"),
    avatarInitialText: () => this.helper.get.elementsText("avatar-initial"),
    error: () => this.helper.get.elementByTestId("edit-profile-error"),
    errorText: () => this.helper.get.elementsText("edit-profile-error"),
    success: () => this.helper.get.elementByTestId("edit-profile-success"),
    successText: () => this.helper.get.elementsText("edit-profile-success"),
    saveButtonText: () => this.helper.get.elementsText("save-button"),
    updateRequestBody: () => this.helper.get.requestBody("updateProfile"),
  };
}
