# Quick Postman Examples

Base URL:

```text
http://localhost:3000
```

## Create task

**POST** `/api/tasks`

Body -> raw -> JSON:

```json
{
  "title": "Learn Docker",
  "description": "Understand images and containers",
  "completed": false
}
```

## List tasks

**GET** `/api/tasks`

## Get one task

**GET** `/api/tasks/<TASK_ID>`

## Update task

**PUT** `/api/tasks/<TASK_ID>`

```json
{
  "completed": true
}
```

## Delete task

**DELETE** `/api/tasks/<TASK_ID>`
