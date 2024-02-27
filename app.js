const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

// API 1
app.get('/todos/', async (request, response) => {
  let data = null
  let query = ''
  const {search_q = '', status, priority} = request.query
  const bothPriorityAndStatus = requestQuery => {
    return (
      requestQuery.status !== undefined && requestQuery.priority !== undefined
    )
  }
  const hasPriority = requestQuery => {
    return requestQuery.priority !== undefined
  }
  const hasStatus = requestQuery => {
    return requestQuery.status !== undefined
  }
  switch (true) {
    case bothPriorityAndStatus(request.query):
      query = `
     SELECT * FROM todo WHERE
     todo LIKE '%${search_q}%' AND
     priority = '${priority}' AND
     status='${status}';`
      break

    case hasPriority(request.query):
      query = `
     SELECT * FROM todo WHERE
     todo LIKE '%${search_q}%' AND
     priority='${priority}';`
      break

    case hasStatus(request.query):
      query = `
     SELECT * FROM todo 
     WHERE todo LIKE '%${search_q}%' AND
     status='${status}';`
      break

    default:
      query = `
     SELECT * FROM todo 
     WHERE todo LIKE '%${search_q}%';`
      break
  }
  const dbResponse = await db.all(query)
  response.send(dbResponse)
})

// API 2
app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const query = `
  SELECT * FROM todo WHERE id=${todoId};`
  const result = await db.get(query)
  response.send(result)
})

// API 3
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const query = `
  INSERT into todo (id, todo, priority, status)
  VALUES(
    ${id},
    "${todo}",
    "${priority}",
    "${status}"
    );`
  await db.run(query)
  response.send('Todo Successfully Added')
})
module.exports = app

// API 4
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const query = `
    SELECT * FROM todo WHERE id=${todoId};`
  const dbResponse = await db.get(query)

  const {
    todo = dbResponse.todo,
    priority = dbResponse.priority,
    status = dbResponse.status,
  } = request.body
  const updateQuery = `
    UPDATE todo SET todo='${todo}', 
    priority='${priority}',
    status='${status}'
    WHERE id=${todoId};`
  await db.run(updateQuery)
  response.send(`${updateColumn} Updated`)
})

// API 5
app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const query = `
  DELETE FROM todo WHERE id=${todoId};`
  await db.run(query)
  response.send('Todo Deleted')
})
