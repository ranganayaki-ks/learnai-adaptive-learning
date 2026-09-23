# LearnAI Backend Integration Guide

This guide describes how to create a separate Spring Boot backend for LearnAI, connect it to the existing React frontend, and model the data required by adaptive-learning algorithms. The backend should run independently on `http://localhost:8080`, while the frontend continues to run on its Vite development server.

> **Boundary:** Keep the backend in a separate repository or directory. Do not place Java, Maven, SQL, or Spring files inside the frontend project’s `server/` directory. The current frontend can continue to use mock data until the backend is ready.

## 1. Recommended repository layout

Use two sibling projects rather than a monorepo at first:

```text
learnai/
├── learnai-frontend/       # existing React + Vite project
└── learnai-backend/        # new Spring Boot + MySQL project
```

Create the backend from [Spring Initializr][1] with Java 21, Maven, and these dependencies:

| Dependency | Purpose |
|---|---|
| Spring Web | REST controllers and JSON responses |
| Spring Data JPA | Repository and persistence abstractions |
| MySQL Driver | JDBC connection to MySQL |
| Spring Security | Authentication and authorization |
| Validation | Bean Validation annotations such as `@NotBlank` and `@Email` |
| Lombok | Optional reduction of boilerplate |
| Springdoc OpenAPI | Swagger UI and OpenAPI documentation |
| Flyway Migration | Versioned database migrations |
| JJWT | JWT creation and verification |

A minimal Maven dependency section is:

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  <dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
  </dependency>
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.13</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
  </dependency>
  <dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
```

Create the project with the usual commands:

```bash
mkdir -p ~/projects
cd ~/projects
# Generate the project with Spring Initializr, or download the generated ZIP.
unzip learnai-backend.zip -d learnai-backend
cd learnai-backend
./mvnw spring-boot:run
```

The application should expose its REST API under `/api` and its Swagger UI under `/swagger-ui.html`.

## 2. Configuration and environment variables

Use environment variables rather than committing credentials. A suitable `application.yml` is:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/learnai_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}
    username: ${DB_USERNAME:learnai}
    password: ${DB_PASSWORD:change-me}
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        jdbc:
          time_zone: UTC
  flyway:
    enabled: true
    locations: classpath:db/migration

server:
  port: ${PORT:8080}
  servlet:
    context-path: /

learnai:
  jwt:
    secret: ${JWT_SECRET:replace-with-a-long-random-secret-at-least-32-bytes}
    access-token-minutes: ${JWT_ACCESS_MINUTES:30}
    refresh-token-days: ${JWT_REFRESH_DAYS:14}

springdoc:
  swagger-ui:
    path: /swagger-ui.html

cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000}
```

Create the database and a least-privilege application user once:

```sql
CREATE DATABASE learnai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'learnai'@'localhost' IDENTIFIED BY 'change-me';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON learnai_db.* TO 'learnai'@'localhost';
FLUSH PRIVILEGES;
```

Use Flyway migrations. The first migration should be `src/main/resources/db/migration/V1__create_core_schema.sql`.

## 3. Database design

The database must distinguish **content**, **learner events**, and **derived learner state**. This separation is what allows the adaptive algorithms to be replaced later without redesigning the content model.

### 3.1 Core schema

The following DDL is a practical baseline. It uses `BIGINT` identifiers, UTC timestamps, foreign keys, unique constraints, and indexes for the queries required by dashboards and adaptive services.

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('STUDENT','ADMIN','INSTRUCTOR') NOT NULL DEFAULT 'STUDENT',
  college VARCHAR(180),
  department VARCHAR(180),
  year_of_study SMALLINT,
  profile_image VARCHAR(500),
  learning_goal VARCHAR(180),
  skill_level ENUM('BEGINNER','INTERMEDIATE','ADVANCED'),
  daily_learning_minutes INT,
  preferred_difficulty ENUM('EASY','BALANCED','CHALLENGING'),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE user_preferences (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  preferred_language VARCHAR(30) NOT NULL DEFAULT 'en',
  preferred_difficulty ENUM('EASY','BALANCED','CHALLENGING') NOT NULL DEFAULT 'BALANCED',
  daily_learning_minutes INT NOT NULL DEFAULT 30,
  preferred_learning_time VARCHAR(40),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  ai_assistance_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE user_interests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  interest_name VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_user_interest (user_id, interest_name),
  CONSTRAINT fk_interests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_interests_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE learning_goals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  target_role VARCHAR(120),
  target_date DATE,
  status ENUM('ACTIVE','COMPLETED','PAUSED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_goals_user_status (user_id, status)
) ENGINE=InnoDB;

CREATE TABLE courses (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  category ENUM('PROGRAMMING','DATABASE','WEB_DEVELOPMENT','AI_ML','COMPUTER_SCIENCE','INTERVIEW_PREPARATION') NOT NULL,
  difficulty ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL,
  estimated_hours DECIMAL(7,2),
  thumbnail_url VARCHAR(500),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_courses_creator FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_courses_catalog (is_published, category, difficulty)
) ENGINE=InnoDB;

CREATE TABLE course_modules (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  module_order INT NOT NULL,
  difficulty ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_course_module_order (course_id, module_order),
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_modules_course (course_id, module_order)
) ENGINE=InnoDB;

CREATE TABLE topics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_id BIGINT NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  topic_order INT NOT NULL,
  difficulty ENUM('BEGINNER','INTERMEDIATE','ADVANCED') NOT NULL,
  estimated_minutes INT,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_module_topic_order (module_id, topic_order),
  CONSTRAINT fk_topics_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE,
  INDEX idx_topics_module (module_id, topic_order)
) ENGINE=InnoDB;

CREATE TABLE topic_prerequisites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  topic_id BIGINT NOT NULL,
  prerequisite_topic_id BIGINT NOT NULL,
  required_mastery_percentage DECIMAL(5,2) NOT NULL DEFAULT 70,
  UNIQUE KEY uq_topic_prerequisite (topic_id, prerequisite_topic_id),
  CONSTRAINT fk_prereq_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT fk_prereq_required FOREIGN KEY (prerequisite_topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  CONSTRAINT chk_no_self_prereq CHECK (topic_id <> prerequisite_topic_id),
  INDEX idx_prereq_topic (topic_id),
  INDEX idx_prereq_required (prerequisite_topic_id)
) ENGINE=InnoDB;

CREATE TABLE lessons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  topic_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  content LONGTEXT,
  lesson_type ENUM('TEXT','VIDEO','INTERACTIVE','CODE','AI_GENERATED') NOT NULL,
  estimated_minutes INT,
  lesson_order INT NOT NULL,
  video_url VARCHAR(500),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_topic_lesson_order (topic_id, lesson_order),
  CONSTRAINT fk_lessons_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  INDEX idx_lessons_topic (topic_id, lesson_order)
) ENGINE=InnoDB;

CREATE TABLE learning_resources (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lesson_id BIGINT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  resource_type ENUM('VIDEO','ARTICLE','PDF','DOCUMENT','CODE','PRACTICE') NOT NULL,
  url VARCHAR(500),
  content LONGTEXT,
  difficulty ENUM('BEGINNER','INTERMEDIATE','ADVANCED'),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_resources_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE course_enrollments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  status ENUM('ACTIVE','COMPLETED','PAUSED') NOT NULL DEFAULT 'ACTIVE',
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  completed_at TIMESTAMP(6),
  last_accessed_at TIMESTAMP(6),
  UNIQUE KEY uq_enrollment (user_id, course_id),
  CONSTRAINT fk_enrollment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_enrollments_user_status (user_id, status)
) ENGINE=InnoDB;

CREATE TABLE lesson_progress (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  lesson_id BIGINT NOT NULL,
  status ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  time_spent_seconds BIGINT NOT NULL DEFAULT 0,
  started_at TIMESTAMP(6),
  completed_at TIMESTAMP(6),
  last_accessed_at TIMESTAMP(6),
  UNIQUE KEY uq_lesson_progress (user_id, lesson_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_progress_user_status (user_id, status)
) ENGINE=InnoDB;
```

### 3.2 Assessment, answer, and event tables

These tables preserve the raw signals needed for adaptive algorithms. Do not store only a final score. The algorithm needs question difficulty, response time, correctness, attempt number, and the related topic.

```sql
CREATE TABLE assessments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_id BIGINT,
  module_id BIGINT,
  topic_id BIGINT,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  assessment_type ENUM('QUIZ','PRACTICE','ADAPTIVE','FINAL','PLACEMENT','INTERVIEW') NOT NULL,
  difficulty ENUM('EASY','MEDIUM','HARD','ADAPTIVE') NOT NULL,
  time_limit_minutes INT,
  total_questions INT NOT NULL,
  is_adaptive BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_assessment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_module FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE SET NULL,
  CONSTRAINT fk_assessment_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  INDEX idx_assessments_topic (topic_id, assessment_type)
) ENGINE=InnoDB;

CREATE TABLE questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assessment_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('MCQ','TRUE_FALSE','CODE','SHORT_ANSWER') NOT NULL,
  difficulty ENUM('EASY','MEDIUM','HARD') NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  estimated_time_seconds INT,
  source VARCHAR(120),
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_questions_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_questions_topic FOREIGN KEY (topic_id) REFERENCES topics(id),
  INDEX idx_questions_selection (topic_id, difficulty, question_type)
) ENGINE=InnoDB;

CREATE TABLE question_options (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  option_text TEXT NOT NULL,
  option_order INT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uq_question_option_order (question_id, option_order),
  CONSTRAINT fk_options_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  assessment_id BIGINT NOT NULL,
  score DECIMAL(7,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  correct_answers INT NOT NULL,
  total_questions INT NOT NULL,
  started_at TIMESTAMP(6) NOT NULL,
  completed_at TIMESTAMP(6) NOT NULL,
  attempt_number INT NOT NULL,
  CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id),
  INDEX idx_attempts_user_time (user_id, completed_at),
  INDEX idx_attempts_assessment (assessment_id, completed_at)
) ENGINE=InnoDB;

CREATE TABLE quiz_answers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  attempt_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT,
  difficulty_at_time ENUM('EASY','MEDIUM','HARD'),
  error_category VARCHAR(160),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions(id),
  INDEX idx_answers_attempt (attempt_id),
  INDEX idx_answers_question_correct (question_id, is_correct)
) ENGINE=InnoDB;

CREATE TABLE learning_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  event_type ENUM('LESSON_STARTED','LESSON_COMPLETED','QUESTION_ANSWERED','QUIZ_COMPLETED','FLASHCARD_REVIEWED','RESOURCE_VIEWED','AI_ASSISTANCE_USED','GOAL_UPDATED') NOT NULL,
  course_id BIGINT,
  module_id BIGINT,
  topic_id BIGINT,
  lesson_id BIGINT,
  assessment_id BIGINT,
  question_id BIGINT,
  event_payload JSON,
  occurred_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_events_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  INDEX idx_events_user_time (user_id, occurred_at),
  INDEX idx_events_topic_time (topic_id, occurred_at)
) ENGINE=InnoDB;
```

### 3.3 Learner-model tables

`topic_mastery` is the current materialized state. `learning_events` and `quiz_answers` remain the source of evidence. This lets you recompute mastery if the scoring model changes.

```sql
CREATE TABLE topic_mastery (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  mastery_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  original_mastery_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0,
  questions_attempted INT NOT NULL DEFAULT 0,
  questions_correct INT NOT NULL DEFAULT 0,
  repeated_error_count INT NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP(6),
  next_review_at TIMESTAMP(6),
  status ENUM('NOT_STARTED','LEARNING','NEEDS_REVIEW','MASTERED','WEAK') NOT NULL DEFAULT 'NOT_STARTED',
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_user_topic_mastery (user_id, topic_id),
  CONSTRAINT fk_mastery_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_mastery_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  INDEX idx_mastery_review (user_id, next_review_at),
  INDEX idx_mastery_status (user_id, status)
) ENGINE=InnoDB;

CREATE TABLE error_patterns (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  error_category VARCHAR(160) NOT NULL,
  misconception TEXT,
  occurrence_count INT NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolved_at TIMESTAMP(6),
  CONSTRAINT fk_errors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_errors_topic FOREIGN KEY (topic_id) REFERENCES topics(id),
  UNIQUE KEY uq_error_pattern (user_id, topic_id, error_category),
  INDEX idx_errors_user_active (user_id, resolved_at, occurrence_count)
) ENGINE=InnoDB;

CREATE TABLE recommendations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  topic_id BIGINT,
  lesson_id BIGINT,
  recommendation_type ENUM('LESSON','PRACTICE','RESOURCE','REVIEW','PROJECT','ASSESSMENT') NOT NULL,
  title VARCHAR(200) NOT NULL,
  reason_code ENUM('WEAK_TOPIC','REPEATED_ERRORS','PREREQUISITE','KNOWLEDGE_DECAY','GOAL_ALIGNMENT','HIGHER_DIFFICULTY','NOT_REVIEWED') NOT NULL,
  reason_text TEXT NOT NULL,
  priority_score DECIMAL(8,4) NOT NULL DEFAULT 0,
  status ENUM('PENDING','STARTED','COMPLETED','DISMISSED') NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP(6),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_recommendations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_recommendations_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_recommendations_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  INDEX idx_recommendations_user_status (user_id, status, priority_score)
) ENGINE=InnoDB;

CREATE TABLE review_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  topic_id BIGINT NOT NULL,
  mastery_id BIGINT NOT NULL,
  interval_days INT NOT NULL DEFAULT 1,
  ease_factor DECIMAL(5,2) NOT NULL DEFAULT 2.50,
  review_count INT NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP(6),
  next_review_at TIMESTAMP(6) NOT NULL,
  status ENUM('DUE','OVERDUE','UPCOMING','SUSPENDED') NOT NULL DEFAULT 'DUE',
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_topic FOREIGN KEY (topic_id) REFERENCES topics(id),
  CONSTRAINT fk_review_mastery FOREIGN KEY (mastery_id) REFERENCES topic_mastery(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review_user_topic (user_id, topic_id),
  INDEX idx_review_queue (user_id, status, next_review_at)
) ENGINE=InnoDB;
```

### 3.4 AI, study-plan, document, and interview tables

```sql
CREATE TABLE study_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  goal_id BIGINT,
  title VARCHAR(180) NOT NULL,
  target_date DATE,
  daily_minutes INT NOT NULL,
  preferred_difficulty ENUM('EASY','BALANCED','CHALLENGING') NOT NULL,
  status ENUM('DRAFT','ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  generated_by ENUM('RULES','AI','MIXED') NOT NULL DEFAULT 'MIXED',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_plans_goal FOREIGN KEY (goal_id) REFERENCES learning_goals(id) ON DELETE SET NULL,
  INDEX idx_plans_user_status (user_id, status)
) ENGINE=InnoDB;

CREATE TABLE study_plan_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  study_plan_id BIGINT NOT NULL,
  topic_id BIGINT,
  lesson_id BIGINT,
  assessment_id BIGINT,
  scheduled_date DATE NOT NULL,
  item_type ENUM('LESSON','PRACTICE','REVIEW','ASSESSMENT','RESOURCE') NOT NULL,
  title VARCHAR(180) NOT NULL,
  estimated_minutes INT NOT NULL,
  sequence_order INT NOT NULL,
  status ENUM('UPCOMING','IN_PROGRESS','COMPLETED','SKIPPED') NOT NULL DEFAULT 'UPCOMING',
  CONSTRAINT fk_plan_items_plan FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_items_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  CONSTRAINT fk_plan_items_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  CONSTRAINT fk_plan_items_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE SET NULL,
  INDEX idx_plan_items_schedule (study_plan_id, scheduled_date, sequence_order)
) ENGINE=InnoDB;

CREATE TABLE flashcards (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  topic_id BIGINT,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  difficulty ENUM('EASY','MEDIUM','HARD'),
  source ENUM('MANUAL','AI','LESSON','DOCUMENT') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_flashcards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_flashcards_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
  INDEX idx_flashcards_user_topic (user_id, topic_id, is_active)
) ENGINE=InnoDB;

CREATE TABLE documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  storage_key VARCHAR(500),
  mime_type VARCHAR(120) NOT NULL,
  file_size_bytes BIGINT,
  processing_status ENUM('UPLOADED','PROCESSING','COMPLETED','FAILED') NOT NULL DEFAULT 'UPLOADED',
  extracted_text LONGTEXT,
  generated_summary LONGTEXT,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_documents_user_status (user_id, processing_status)
) ENGINE=InnoDB;

CREATE TABLE interview_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  target_track VARCHAR(100) NOT NULL,
  difficulty ENUM('EASY','MEDIUM','HARD') NOT NULL,
  question_count INT NOT NULL,
  status ENUM('SETUP','IN_PROGRESS','COMPLETED','ABANDONED') NOT NULL DEFAULT 'SETUP',
  overall_score DECIMAL(5,2),
  analysis JSON,
  started_at TIMESTAMP(6),
  completed_at TIMESTAMP(6),
  CONSTRAINT fk_interview_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_interview_user_status (user_id, status)
) ENGINE=InnoDB;

CREATE TABLE interview_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT NOT NULL,
  question_order INT NOT NULL,
  question_text TEXT NOT NULL,
  answer_text LONGTEXT,
  score DECIMAL(5,2),
  feedback TEXT,
  topics JSON,
  CONSTRAINT fk_interview_questions_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
  UNIQUE KEY uq_interview_question_order (session_id, question_order)
) ENGINE=InnoDB;
```

Analytics should initially be computed from `learning_events`, `quiz_attempts`, `quiz_answers`, and `topic_mastery`. Add summary tables only after profiling shows that dashboard queries need them. Avoid storing a second authoritative copy of mastery in an analytics table.

## 4. JPA entity model

Use `Instant` for persisted timestamps and configure Hibernate to use UTC. Add a mapped superclass for audit fields:

```java
@MappedSuperclass
@Getter
@Setter
public abstract class AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

Use enums with `@Enumerated(EnumType.STRING)`. Do not expose entities directly from controllers. Return DTOs such as `CourseSummaryResponse`, `DashboardResponse`, and `QuizSubmissionResponse`.

### 4.1 Required entity inventory

| Entity | Table | Important relationships |
|---|---|---|
| `User` | `users` | One-to-one preferences; one-to-many interests, goals, enrollments, events |
| `UserPreference` | `user_preferences` | One-to-one user |
| `UserInterest` | `user_interests` | Many-to-one user |
| `LearningGoal` | `learning_goals` | Many-to-one user; one-to-many study plans |
| `Course` | `courses` | Many-to-one creator; one-to-many modules, assessments, enrollments |
| `CourseModule` | `course_modules` | Many-to-one course; one-to-many topics |
| `Topic` | `topics` | Many-to-one module; one-to-many lessons and mastery records |
| `TopicPrerequisite` | `topic_prerequisites` | Many-to-one topic and prerequisite topic |
| `Lesson` | `lessons` | Many-to-one topic; one-to-many resources and progress |
| `LearningResource` | `learning_resources` | Many-to-one lesson |
| `CourseEnrollment` | `course_enrollments` | Many-to-one user and course |
| `LessonProgress` | `lesson_progress` | Many-to-one user and lesson |
| `Assessment` | `assessments` | Optional course, module, and topic; one-to-many questions and attempts |
| `Question` | `questions` | Many-to-one assessment and topic; one-to-many options and answers |
| `QuestionOption` | `question_options` | Many-to-one question |
| `QuizAttempt` | `quiz_attempts` | Many-to-one user and assessment; one-to-many answers |
| `QuizAnswer` | `quiz_answers` | Many-to-one attempt and question |
| `LearningEvent` | `learning_events` | Many-to-one user and optional content references |
| `TopicMastery` | `topic_mastery` | Many-to-one user and topic; one-to-one review item |
| `ErrorPattern` | `error_patterns` | Many-to-one user and topic |
| `Recommendation` | `recommendations` | Many-to-one user; optional topic and lesson |
| `ReviewItem` | `review_items` | Many-to-one user, topic, and mastery |
| `StudyPlan` | `study_plans` | Many-to-one user and goal; one-to-many items |
| `StudyPlanItem` | `study_plan_items` | Many-to-one plan; optional content references |
| `Flashcard` | `flashcards` | Optional many-to-one user and topic |
| `Document` | `documents` | Many-to-one user |
| `InterviewSession` | `interview_sessions` | Many-to-one user; one-to-many questions |
| `InterviewQuestion` | `interview_questions` | Many-to-one session |

### 4.2 Representative JPA entities

The following entities demonstrate the important mappings. Apply the same pattern to the remaining content entities.

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_role_active", columnList = "role,is_active")
})
@Getter
@Setter
public class User extends AuditableEntity {
    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role = UserRole.STUDENT;

    private String college;
    private String department;
    private Short yearOfStudy;
    private String profileImage;
    private String learningGoal;
    private Integer dailyLearningMinutes;

    @Enumerated(EnumType.STRING)
    private SkillLevel skillLevel;

    @Enumerated(EnumType.STRING)
    private PreferredDifficulty preferredDifficulty;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
```

```java
@Entity
@Table(name = "topics", uniqueConstraints = @UniqueConstraint(
    name = "uq_module_topic_order", columnNames = {"module_id", "topic_order"}))
@Getter
@Setter
public class Topic extends AuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "module_id", nullable = false)
    private CourseModule module;

    @Column(nullable = false, length = 180)
    private String name;

    @Lob
    private String description;

    @Column(name = "topic_order", nullable = false)
    private int topicOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Difficulty difficulty;

    private Integer estimatedMinutes;
}
```

```java
@Entity
@Table(name = "topic_mastery", uniqueConstraints = @UniqueConstraint(
    name = "uq_user_topic_mastery", columnNames = {"user_id", "topic_id"}), indexes = {
    @Index(name = "idx_mastery_review", columnList = "user_id,next_review_at"),
    @Index(name = "idx_mastery_status", columnList = "user_id,status")
})
@Getter
@Setter
public class TopicMastery extends AuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal masteryPercentage = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal originalMasteryPercentage = BigDecimal.ZERO;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal confidence = BigDecimal.ZERO;

    @Column(nullable = false)
    private int questionsAttempted;

    @Column(nullable = false)
    private int questionsCorrect;

    @Column(nullable = false)
    private int repeatedErrorCount;

    private Instant lastReviewedAt;
    private Instant nextReviewAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MasteryStatus status = MasteryStatus.NOT_STARTED;

    @Version
    private long version;
}
```

```java
@Entity
@Table(name = "learning_events", indexes = {
    @Index(name = "idx_events_user_time", columnList = "user_id,occurred_at"),
    @Index(name = "idx_events_topic_time", columnList = "topic_id,occurred_at")
})
@Getter
@Setter
public class LearningEvent extends AuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private LearningEventType eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id")
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private Question question;

    @Column(name = "event_payload", columnDefinition = "json")
    private String eventPayload;

    @Column(nullable = false)
    private Instant occurredAt;
}
```

```java
@Entity
@Table(name = "quiz_attempts", indexes = {
    @Index(name = "idx_attempts_user_time", columnList = "user_id,completed_at")
})
@Getter
@Setter
public class QuizAttempt extends AuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(nullable = false, precision = 7, scale = 2)
    private BigDecimal score;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal percentage;

    private int correctAnswers;
    private int totalQuestions;
    private Instant startedAt;
    private Instant completedAt;
    private int attemptNumber;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuizAnswer> answers = new ArrayList<>();
}
```

The key design rule is that `QuizAttempt` is immutable evidence after completion, while `TopicMastery`, `ErrorPattern`, `ReviewItem`, and `Recommendation` are derived and can be recalculated inside a transaction.

## 5. Adaptive-learning service flow

When a student submits an answer, the backend should execute one transaction with the following sequence:

1. Resolve the authenticated user from `SecurityContext`, never from a request `userId`.
2. Load the question, topic, assessment, and current `TopicMastery` record.
3. Create a `QuizAnswer` containing correctness, selected answer, time spent, and difficulty.
4. Update or create the `QuizAttempt`.
5. Append a `LearningEvent` with the answer signal.
6. Update `TopicMastery` using the current rule-based model.
7. Upsert an `ErrorPattern` when the answer is wrong and a misconception category is available.
8. Recalculate the `ReviewItem` interval and next review date.
9. Rebuild or refresh recommendations for the affected topic and its dependants.
10. Select the next adaptive question using the new mastery and recent error history.
11. Return the updated mastery, feedback, explanation, recommendation, and next-question metadata.

A starting rule-based mastery function can be:

```text
new_mastery = clamp(
  0.70 * old_mastery
  + 0.20 * current_answer_signal
  + 0.10 * recent_accuracy,
  0,
  100
)
```

Use a positive `current_answer_signal` for a correct answer and a negative signal for an incorrect answer. Keep the formula inside a service such as `MasteryService`; do not embed it in a controller. Later, the service can be replaced with Bayesian Knowledge Tracing, Item Response Theory, or another model without changing the REST contract.

A recommendation priority can combine weak mastery, repeated errors, prerequisite blocking, decay, and goal alignment:

```text
priority =
  0.35 * weakness_score
+ 0.25 * repeated_error_score
+ 0.20 * decay_score
+ 0.10 * prerequisite_score
+ 0.10 * goal_alignment_score
```

Store the evidence as `reasonCode` and `reasonText` so the UI can explain every recommendation.

## 6. REST API contract

Use a consistent envelope for all responses:

```json
{
  "success": true,
  "message": "Recommendations fetched successfully",
  "data": {}
}
```

Recommended endpoints are:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create a student and return tokens |
| `POST` | `/api/auth/login` | Authenticate and return tokens |
| `POST` | `/api/auth/refresh` | Rotate an access token |
| `GET` | `/api/dashboard` | Return dashboard KPIs and recommendations |
| `GET` | `/api/courses` | Paginated course catalog |
| `GET` | `/api/courses/{courseId}` | Course structure and progress |
| `POST` | `/api/courses/{courseId}/enroll` | Enroll the current user |
| `GET` | `/api/lessons/{lessonId}` | Lesson content and progress |
| `POST` | `/api/lessons/{lessonId}/complete` | Complete a lesson and emit an event |
| `GET` | `/api/assessments` | List assessments available to the user |
| `GET` | `/api/assessments/{id}/questions/next` | Select the next adaptive question |
| `POST` | `/api/assessments/{id}/attempts` | Submit an attempt and update learner state |
| `GET` | `/api/mastery` | Topic-level mastery records |
| `GET` | `/api/error-patterns` | Repeated mistakes and misconceptions |
| `GET` | `/api/recommendations` | Explainable recommendations |
| `GET` | `/api/knowledge-graph` | Nodes, edges, mastery, and prerequisites |
| `GET` | `/api/reviews` | Due, overdue, and upcoming review items |
| `GET` | `/api/analytics` | Charts and learning activity aggregates |
| `GET` | `/api/study-plans/current` | Current personalized study plan |
| `POST` | `/api/study-plans/generate` | Generate or regenerate a plan |
| `GET` | `/api/flashcards` | User flashcards |
| `POST` | `/api/ai/chat` | Context-aware AI tutor request |
| `POST` | `/api/ai/questions` | Generate draft questions |
| `POST` | `/api/ai/summary` | Generate a lesson summary |
| `POST` | `/api/documents` | Upload a learning document |
| `GET` | `/api/documents/{id}` | Check document processing status |
| `POST` | `/api/interviews` | Start an interview session |
| `POST` | `/api/interviews/{id}/answers` | Submit an interview answer |
| `GET` | `/api/goals` | Current learning goals |
| `POST` | `/api/goals` | Create a goal |
| `GET` | `/api/admin/analytics` | Admin analytics, role protected |
| `POST` | `/api/admin/questions/generate` | Generate draft question content |

All student endpoints should derive the user from the JWT. The frontend must not be allowed to choose another `userId`, role, mastery value, or recommendation score.

## 7. Frontend `api.ts` integration

The existing frontend uses `client/src/services/api.ts` as a mock service boundary. Preserve that boundary and replace its internals with HTTP requests. This lets pages continue calling `api.getCourses()`, `api.getRecommendations()`, and similar methods.

Create `client/src/services/http.ts`:

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';

export function getAccessToken() {
  return localStorage.getItem('learnai-access-token');
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('learnai-access-token', token);
  else localStorage.removeItem('learnai-access-token');
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
}

export { API_BASE_URL };
```

Set the frontend environment variable in `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

Then replace the mock `api.ts` implementation with this integration-oriented version:

```ts
import { http } from './http';

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours?: number;
  progress?: number;
};

export type QuizSubmission = {
  questionId: string;
  selectedAnswer: string;
  timeSpentSeconds: number;
};

export const api = {
  getStudentDashboard: () => http('/dashboard'),
  getCourses: (params: { page?: number; size?: number; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));
    if (params.category) query.set('category', params.category);
    return http(`/courses${query.toString() ? `?${query}` : ''}`);
  },
  getCourseById: (id: string) => http<Course>(`/courses/${id}`),
  getModules: (courseId: string) => http(`/courses/${courseId}/modules`),
  getTopics: (moduleId: string) => http(`/modules/${moduleId}/topics`),
  getLessons: (topicId: string) => http(`/topics/${topicId}/lessons`),
  getLesson: (lessonId: string) => http(`/lessons/${lessonId}`),
  completeLesson: (lessonId: string, timeSpentSeconds: number) => http(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ timeSpentSeconds }),
  }),
  getLearningPath: () => http('/learning-path'),
  getAssessments: () => http('/assessments'),
  getQuizQuestions: (assessmentId: string) => http(`/assessments/${assessmentId}/questions`),
  getAdaptiveQuestion: (assessmentId: string) => http(`/assessments/${assessmentId}/questions/next`),
  submitQuiz: (assessmentId: string, answers: QuizSubmission[], startedAt: string) => http(`/assessments/${assessmentId}/attempts`, {
    method: 'POST',
    body: JSON.stringify({ startedAt, answers }),
  }),
  getMastery: () => http('/mastery'),
  getErrorPatterns: () => http('/error-patterns'),
  getRecommendations: () => http('/recommendations'),
  getKnowledgeGraph: () => http('/knowledge-graph'),
  getReviewCenter: () => http('/reviews'),
  getAnalytics: (range = '90d') => http(`/analytics?range=${encodeURIComponent(range)}`),
  getSkillGap: (targetRole: string) => http(`/skill-gap?targetRole=${encodeURIComponent(targetRole)}`),
  getStudyPlan: () => http('/study-plans/current'),
  generateStudyPlan: (input: { goalId?: string; targetDate: string; dailyMinutes: number; difficulty: string }) => http('/study-plans/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  getFlashcards: () => http('/flashcards'),
  generateFlashcards: (input: { topicId: string; difficulty: string; count: number }) => http('/ai/flashcards', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  getAIResponse: (input: { message: string; lessonId?: string; topicId?: string }) => http('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  generateQuestions: (input: { topicId: string; difficulty: string; count: number; questionType: string }) => http('/ai/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  generateSummary: (input: { lessonId?: string; documentId?: string }) => http('/ai/summary', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return http('/documents', { method: 'POST', body: formData });
  },
  getDocument: (id: string) => http(`/documents/${id}`),
  getGoals: () => http('/goals'),
  createGoal: (input: { title: string; targetRole: string; targetDate: string }) => http('/goals', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  startInterview: (input: { targetTrack: string; difficulty: string; questionCount: number }) => http('/interviews', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  submitInterviewAnswer: (sessionId: string, input: { questionId: string; answer: string }) => http(`/interviews/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  getAdminAnalytics: () => http('/admin/analytics'),
  getAdminStudents: () => http('/admin/students'),
  getAdminQuestions: () => http('/admin/questions'),
};

export default api;
```

The current frontend quiz page calls the mock method with only an array of numeric answers. Change that call to include the assessment ID and the per-question metadata:

```ts
await api.submitQuiz(assessmentId, answers.map((answer, index) => ({
  questionId: questions[index].id,
  selectedAnswer: String(answer),
  timeSpentSeconds: questionTimes[index] ?? 0,
})), startedAt.toISOString());
```

Because `uploadDocument` sends `FormData`, do not set `Content-Type` manually for that request. The browser must supply the multipart boundary.

## 8. JWT authentication changes in `AuthContext`

The frontend’s current `AuthContext` can remain the session owner, but its `login` and `register` methods must call the backend and store the access token.

```ts
import { http, setAccessToken } from '../services/http';

type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

async function login(email: string, password: string) {
  const response = await http<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(response.accessToken);
  setUser(response.user);
  return response.user;
}

async function register(input: RegisterInput) {
  const response = await http<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  setAccessToken(response.accessToken);
  setUser(response.user);
  return response.user;
}

function logout() {
  setAccessToken(null);
  localStorage.removeItem('learnai-user');
  setUser(null);
}
```

For production, use a refresh-token strategy that keeps the refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie. Storing long-lived refresh tokens in `localStorage` increases the impact of an XSS vulnerability.

## 9. CORS and security configuration

During local development, allow only the Vite origin:

```java
@Configuration
public class CorsConfig {
    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${cors.allowed-origins}") String allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

The security chain should be stateless, disable CSRF for a pure bearer-token API, permit authentication and Swagger endpoints, and protect admin endpoints with role checks:

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http,
                                         JwtAuthenticationFilter jwtFilter) throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(Customizer.withDefaults())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
}
```

## 10. Implementation order

Build the backend in vertical slices rather than creating all empty classes first. The fastest reliable sequence is:

1. Create the project, configuration, Flyway migration, enums, `User`, authentication DTOs, JWT service, and security filter.
2. Implement registration, login, current-user, and CORS. Verify with Swagger before adding learning features.
3. Add courses, modules, topics, lessons, prerequisites, enrollment, and progress.
4. Add assessments, questions, attempts, answers, and learning events.
5. Implement `TopicMasteryService`, `ErrorPatternService`, and `ReviewService` in one transaction after each quiz submission.
6. Implement recommendation generation from the materialized learner state.
7. Add dashboard, analytics, knowledge graph, study plans, flashcards, documents, and interviews.
8. Add admin endpoints and seed data for the ten course families described in the product specification.
9. Add unit tests for mastery updates, prerequisite checks, recommendation reasons, review intervals, and authorization.
10. Replace the frontend mock API one domain at a time, beginning with authentication and course catalog.

## 11. Verification checklist

The integration is ready when the following checks pass:

- The backend starts with an empty MySQL database and Flyway creates the schema.
- Registration stores a BCrypt hash rather than a plain-text password.
- Login returns a JWT and protected endpoints reject missing or invalid tokens.
- A student cannot read or mutate another student’s learner state by changing an ID in the request.
- An admin endpoint rejects a student token with HTTP 403.
- A quiz submission creates an attempt, answers, learning events, mastery updates, error patterns, and review scheduling changes in one transaction.
- Every recommendation contains a reason code and human-readable reason text.
- The next adaptive question changes when mastery or recent error patterns change.
- The frontend can load courses, dashboard data, recommendations, and analytics with `VITE_API_BASE_URL=http://localhost:8080/api`.
- CORS permits the frontend development origin but not arbitrary origins.

## References

[1]: https://start.spring.io/ "Spring Initializr"
[2]: https://docs.spring.io/spring-boot/reference/ "Spring Boot Reference Documentation"
[3]: https://docs.spring.io/spring-data/jpa/reference/ "Spring Data JPA Reference Documentation"
[4]: https://docs.spring.io/spring-security/reference/ "Spring Security Reference Documentation"
[5]: https://documentation.red-gate.com/flyway "Flyway Documentation"
[6]: https://springdoc.org/ "Springdoc OpenAPI Documentation"
