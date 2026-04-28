import { Link } from 'react-router-dom';
import styles from './PolicyPage.module.css';

function TermsOfUsePage() {
  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link className={styles.backLink} to="/register">Back to registration</Link>

        <h1 className={styles.title}>Terms of use</h1>
        <p className={styles.intro}>
          Heritage Platform is a student project that provides access to digital cultural heritage
          resources for learning, coursework, research practice, and personal exploration. These
          terms describe how visitors, registered users, contributors, and administrators should use
          the platform responsibly.
        </p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. About Heritage Platform</h2>
          <p>
            The platform lets visitors browse approved heritage resources, search resources, explore
            resources by category, open resource detail pages, view uploaded media and attachments,
            follow external links, and read public comments.
          </p>
          <p>
            Registered users can log in, manage a profile, upload an avatar, like approved
            resources, and post comments. Users may apply to become contributors. Contributors can
            create drafts, upload resource files, add metadata, submit resources for review, and
            track the review status of their own resources. Administrators can review resources,
            manage contributor applications, manage categories and tags, archive or republish
            resources, and view reporting dashboards.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Definitions</h2>
          <ul>
            <li><strong>Visitor</strong> means someone who uses public parts of the platform without logging in.</li>
            <li><strong>Viewer</strong> means a person who uses Heritage Platform, whether logged in or not.</li>
            <li><strong>Account</strong> means a registered user profile with a username, email address, password, role, and optional profile details.</li>
            <li><strong>Contributor</strong> means a registered user whose role allows them to create and submit heritage resources.</li>
            <li><strong>Administrator</strong> means a user with permission to review submissions and manage platform administration features.</li>
            <li><strong>Resource</strong> means a cultural heritage record submitted to or displayed by the platform.</li>
            <li><strong>Content</strong> means resource titles, descriptions, places, copyright declarations, comments, uploaded media, files, profile information, review feedback, and other material stored or displayed by the platform.</li>
            <li><strong>Metadata</strong> means descriptive information about a resource, such as category, tags, place, status, contributor, timestamps, and related links.</li>
            <li><strong>External link</strong> means a URL added to a resource that points outside Heritage Platform.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Using the platform</h2>
          <p>
            Users should use Heritage Platform lawfully, honestly, and respectfully. Users must not
            misuse accounts, comments, likes, resource submission forms, file uploads, review
            workflows, or administrative tools.
          </p>
          <p>
            Users must not attempt to disrupt the service, overload it with automated requests,
            bypass access controls, attack the system, upload harmful files, impersonate others, or
            use the platform to harass, mislead, or harm other people.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Accounts and registration</h2>
          <p>
            Users must provide accurate registration information and must be at least 13 years old
            to create an account. Users are responsible for keeping their username and password
            secure and for activity carried out through their account.
          </p>
          <p>
            Heritage Platform may restrict or remove accounts used for harmful, illegal, abusive,
            misleading, or security-threatening activity. Administrator accounts must only be used
            for legitimate project review and maintenance tasks.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Profiles, likes, and comments</h2>
          <p>
            Registered users may update profile information, upload an avatar, like approved
            resources, and post comments on resources where comments are enabled. Users are
            responsible for the content of their profile and comments.
          </p>
          <p>
            Comments should stay relevant to the resource and must not contain illegal, offensive,
            abusive, misleading, infringing, or harmful material. The project team may remove or
            restrict content that creates risk for users, contributors, or the platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Contributor submissions and uploads</h2>
          <p>
            Contributors can create draft resources, upload images, videos, audio files, documents,
            and external links, and submit resources for administrator review. Contributor
            applicants may also upload supporting evidence files as part of an application.
          </p>
          <p>
            Contributors must only submit material they have permission to share. They should provide
            accurate titles, descriptions, categories, tags, places, copyright declarations, and
            external links. Contributors must not upload files that are malicious, illegal,
            infringing, private without permission, or unrelated to the heritage resource.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Review, moderation, and administration</h2>
          <p>
            Submitted resources may be approved, rejected, unpublished, republished, or archived by
            administrators. Review feedback and status changes are part of the project workflow and
            may be shown to the contributor in their profile.
          </p>
          <p>
            Administrators should use review, category, tag, application, archive, and reporting
            tools only for project purposes and with care for accuracy and fairness.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Cultural heritage content and rights</h2>
          <p>
            Heritage Platform may display cultural heritage descriptions, images, media files,
            documents, comments, metadata, copyright declarations, and external links submitted by
            contributors or included in project test data. The platform does not automatically own
            uploaded or linked heritage material.
          </p>
          <p>
            Reuse of any item depends on the copyright declaration, information supplied by the
            contributor, any linked source, and applicable law. If rights information is missing,
            unclear, or inconsistent, users should not assume the material is free to reuse.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Resource information and search results</h2>
          <p>
            Search results, category pages, resource metadata, counts, tags, review notes, and
            reports are provided to support discovery and project workflows. They may be incomplete,
            outdated, or affected by user-submitted data. Users should verify important information
            before relying on it for formal research, publication, or legal decisions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Notice and takedown</h2>
          <p>
            If someone believes a resource, upload, comment, profile image, external link, or other
            content infringes rights or should not appear on the platform, they may contact the
            Heritage Platform project team. The team may remove, archive, hide, or restrict disputed
            content while reviewing the issue.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Disclaimer</h2>
          <p>
            Heritage Platform is provided for educational and prototype purposes. The project team
            does not guarantee accuracy, completeness, availability, uninterrupted access, or that
            every feature will work in all circumstances.
          </p>
          <p>
            The project team is not responsible for external websites, external links, contributor
            uploads, user comments, or decisions users make based on information found through the
            platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>12. Changes to these terms</h2>
          <p>
            These terms may be updated as the student project develops. Continued use of Heritage
            Platform after updates are posted means acceptance of the updated terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>13. Contact</h2>
          <p>
            For questions about these terms, please contact the Heritage Platform project team.
          </p>
        </section>

        <p className={styles.updated}>Last updated: April 28, 2026</p>
      </article>
    </main>
  );
}

export default TermsOfUsePage;
