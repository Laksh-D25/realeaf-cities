##Releaf Readme:

  theme: forest
---
erDiagram
    users {
        uuid user_id PK
        text name
        text email
        hash password
        json interests
        url avatar
        boolean is_admin
        datetime created_at
        datetime updated_at
    }

    admin_users {
        uuid admin_id PK
        uuid user_id FK
        text role
        datetime created_at
        datetime updated_at
    }

    events {
        uuid event_id PK
        uuid admin_id FK
        text title
        text desc
        text location
        int seats_left
        int initial_seats
        datetime start_time
        datetime end_time
        datetime expires_at
        datetime created_at
    }

    user_event {
        uuid user_id FK
        uuid event_id FK
    }

    startups {
        uuid startup_id PK
        text name
        text desc
    }

    reviews {
        uuid review_id PK
        uuid startup_id FK
        uuid user_id FK
        text desc
        json images
        int rating
    }

    waste_request {
        uuid waste_id PK
        uuid user_id FK
        text location
        boolean is_completed
        datetime requested_at
        datetime comepleted_on
    }

    logs {
        uuid log_id PK
        uuid user_id FK
        text tilte
        text log
        datetime created_at
        datetime updated_at
    }

    users ||--o{ admin_users : "has"
    users ||--o{ user_event : "has booked"
    users ||--o{ reviews : "give"
    users ||--o{ waste_request : "requests"
    users ||--o{ logs : "write"

    admin_users ||--o{ events : "creates"

    startups||--o{ reviews: "have"

    events ||--o{ user_event : "maps"

Functionality:-

