Feature: Appointment audio recording
  As a clinician
  I want to record audio during a patient appointment and have it transcribed
  So that I can spend less time typing clinical notes during the visit

  Background:
    Given I am logged in as a clinician
    And I have permission for the active appointment's tenant

  Scenario: Happy path — record, upload, transcript appears
    Given I have an active appointment with patient TEST_PATIENT_001
    When I press "Start recording" and speak for 30 seconds
    And I press "Stop recording"
    Then the audio is uploaded with an idempotency key
    And a transcript appears in the clinical note editor within 60 seconds
    And the transcript is editable before I save

  Scenario: Network drop mid-upload
    Given I am recording an appointment
    When the network drops mid-upload
    Then the recording is queued locally
    And the clinician sees "saving locally, will sync"
    And the upload resumes when the network returns
    And no duplicate transcript is created on resume

  Scenario: Transcription vendor is unavailable
    Given the audio uploaded successfully
    When the transcription vendor returns a 5xx for 3 attempts
    Then the clinician sees "transcription unavailable, retry?"
    And the audio is preserved
    And no clinical note is overwritten

  Scenario: Duplicate upload with same idempotency key
    Given the audio uploaded successfully and a transcript was produced
    When the client retries the same upload with the same idempotency key
    Then the server returns 200 with the existing transcript ID
    And no second transcript is created

  Scenario: PHI must not appear in logs
    Given any of the above scenarios occurs
    Then no patient identifier or transcript text appears in application logs
    And no PHI appears in any error stack trace sent to the error tracker
