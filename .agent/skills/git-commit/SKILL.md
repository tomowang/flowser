---
name: git-commit
description: A skill to perform git commits following best practices, ensuring clean and descriptive history.
---

# Git Commit Skill

Follow these steps to ensure high-quality git commits.

## Workflow

1.  **Check Status**
    View the current state of the working directory.

    ```bash
    git status
    ```

2.  **Review Changes**
    Check what has been changed. It is often helpful to view the diffs.

    ```bash
    git diff
    ```

3.  **Stage Files**
    Add only the files relevant to the specific logical change you are making. Avoid adding unrelated files.

    ```bash
    git add <file_path>
    ```

4.  **Generate Commit Message**
    Create a commit message that follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:
    - `feat`: A new feature
    - `fix`: A bug fix
    - `docs`: Documentation only changes
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
    - `refactor`: A code change that neither fixes a bug nor adds a feature
    - `perf`: A code change that improves performance
    - `test`: Adding missing tests or correcting existing tests
    - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

    **Format:** `<type>(<scope>): <subject>`

5.  **Commit**
    Execute the commit command.

    ```bash
    git commit -m "<your_commit_message>"
    ```

6.  **Verify**
    Confirm the commit was created successfully.
    ```bash
    git log -1
    ```
