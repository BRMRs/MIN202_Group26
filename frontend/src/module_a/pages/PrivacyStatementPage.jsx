import { Link } from 'react-router-dom';
import styles from './PolicyPage.module.css';

function PrivacyStatementPage() {
  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link className={styles.backLink} to="/register">Back to registration</Link>

        <h1 className={styles.title}>Privacy statement</h1>
        <p className={styles.intro}>
          Heritage Platform respects user privacy. This statement explains what data the current
          student project may collect, why it is used, and how it relates to features that are
          actually implemented in the platform.
        </p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Who we are</h2>
          <p>
            Heritage Platform is a student project prototype for managing and exploring digital
            cultural heritage resources. The platform includes public browsing, search, resource
            detail pages, account registration and login, profiles, likes, comments, contributor
            applications, resource submission and review, category and tag management, and
            administrator reporting pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. What personal data we collect</h2>
          <p>The current project may collect or store the following information:</p>
          <ul>
            <li>Username, email address, role, account creation time, and account update time.</li>
            <li>Password in encoded form, plus authentication data needed for login.</li>
            <li>Email verification and password reset codes while those flows are active.</li>
            <li>Profile bio and avatar URL if a user adds them.</li>
            <li>Contributor application reason, application status, review result, reject reason, and supporting application files.</li>
            <li>Resources submitted by contributors, including titles, descriptions, categories, tags, places, copyright declarations, external links, status, uploaded media, uploaded documents, and timestamps.</li>
            <li>Comments posted by users and likes attached to resources.</li>
            <li>Administrator review feedback, resource decisions, archive reasons, category and tag management actions, and report-related records.</li>
            <li>Basic technical records that may be produced by the server or development environment, such as request times, error logs, and security/debugging information.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Why we collect this data</h2>
          <p>Data is collected and used to support the actual platform features, including:</p>
          <ul>
            <li>Creating accounts and allowing users to log in securely.</li>
            <li>Sending and checking registration and password reset verification codes.</li>
            <li>Showing profile information, avatars, roles, and contributor application status.</li>
            <li>Allowing contributors to create drafts, upload files, submit resources, and track review results.</li>
            <li>Allowing administrators to review resources, review contributor applications, manage categories and tags, archive resources, and view reports.</li>
            <li>Displaying public resource pages, uploaded media, comments, like counts, comment counts, tags, and external links.</li>
            <li>Maintaining security, preventing misuse, debugging technical problems, and improving project functionality.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Registration and authentication</h2>
          <p>
            Email address, username, and password are needed to create and access an account. The
            backend stores passwords in encoded form. Users are responsible for choosing a strong
            password and keeping login details confidential.
          </p>
          <p>
            The frontend stores the login token in browser local storage so the user can remain
            signed in while using the app. Logging out removes that token from local storage.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Profiles, comments, and likes</h2>
          <p>
            Profile data such as username, email, role, bio, and avatar may be shown in the user's
            profile and in shared interface areas such as the navigation bar. Comments are displayed
            publicly on resource detail pages together with the comment author's username and avatar
            when available.
          </p>
          <p>
            Likes are linked to the user account and the resource. The platform uses this
            information to show whether the current user has liked a resource and to display like
            counts.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Contributor applications and resource submissions</h2>
          <p>
            When a user applies to become a contributor, the platform stores the application reason,
            status, review information, and any supporting files uploaded with the application.
            Administrators can view these details when reviewing applications.
          </p>
          <p>
            Contributor resource submissions store the contributor identity, resource metadata,
            uploaded files, external links, draft and review status, and review feedback. Approved
            resources and their media may be visible to visitors and users through public browsing,
            search, category pages, and resource detail pages.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Browser storage</h2>
          <p>
            The current frontend uses browser local storage for the authentication token and for
            small interface state such as whether certain profile status notifications have been
            read.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. How long we keep data</h2>
          <p>
            Account data is generally kept while the account exists. Resource submissions,
            application records, comments, likes, review feedback, categories, tags, and report data
            are kept as part of the project database unless removed through existing project
            workflows or database maintenance.
          </p>
          <p>
            Verification and reset codes are intended for short-term use. Technical logs may be kept
            for debugging, security, and development needs. Users may request correction or deletion
            where technically possible within the project.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Who can access data</h2>
          <p>
            The project team and authorised maintainers may access data when needed for development,
            testing, maintenance, security, or support. Administrators can access application,
            review, category, tag, resource, and reporting data through the admin interface.
          </p>
          <p>
            Heritage Platform does not sell personal data. Data may be shared only if required for
            technical operation, safety, investigation of misuse, project assessment, or legal
            reasons.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. External links and uploaded content</h2>
          <p>
            Resources may contain external links supplied by contributors. External sites are not
            controlled by Heritage Platform and may have their own privacy practices. Users should
            be careful when following external links.
          </p>
          <p>
            Uploaded images, media, documents, profile avatars, and supporting application files are
            stored so the related platform feature can work. Users should avoid uploading private or
            sensitive information unless it is necessary and appropriate for the project.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Security</h2>
          <p>
            The project aims to use reasonable technical measures for a student prototype, including
            encoded passwords, role-based routes, authentication tokens, and backend access checks.
            No online service can guarantee complete security.
          </p>
          <p>
            Users should choose strong passwords, keep account details safe, and report suspected
            misuse to the project team.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>12. User rights and choices</h2>
          <p>
            Users may request access, correction, or deletion of their account data where technically
            possible. Logged-in users can delete their own account from the Profile page. Some
            records may need to remain temporarily for security, debugging, review history, or
            project integrity.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>13. Changes to this privacy statement</h2>
          <p>
            This privacy statement may be updated as the project develops. Updates should be posted
            on this page so users can understand how data handling changes over time.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>14. Contact</h2>
          <p>
            For privacy questions, please contact the Heritage Platform project team.
          </p>
        </section>

        <p className={styles.updated}>Last updated: April 28, 2026</p>
      </article>
    </main>
  );
}

export default PrivacyStatementPage;
