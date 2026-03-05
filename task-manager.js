const { writeFile } = require('node:fs');
const path = require('node:path');
const fs = require('fs').promises;

/**
 * Validates the tasks file before operations
 * Valida el archivo de tareas antes de las operaciones
 */
async function validateTasksFile() {
    try {
        const stats = await fs.stat('tasks.json');
        
        // Check if file is empty / Verificar si el archivo está vacío
        if (stats.size === 0) {
            console.log("⚠️  Tasks file is empty. Reinitializing...");
            await fs.writeFile('tasks.json', '[]', 'utf8');
            return false;
        }
        
        // Check read/write permissions / Verificar permisos de lectura/escritura
        try {
            await fs.access('tasks.json', fs.constants.R_OK | fs.constants.W_OK);
        } catch {
            console.error("❌ Insufficient permissions for tasks.json");
            console.error("💡 Try: chmod 666 tasks.json (Linux/Mac)");
            return false;
        }
        
        return true;
    } catch (error) {
        // File doesn't exist - will be created in ReadTasks() / Archivo no existe - se creará en ReadTasks()
        if (error.code === 'ENOENT') {
            return true;
        }
        console.error("❌ Error validating tasks file:", error.message);
        return false;
    }
}

/**
 * Validates if a task object has the correct structure
 * Valida si un objeto de tarea tiene la estructura correcta
 */
function isValidTask(task) {
    // Verify task is an object / Verificar que task sea un objeto
    if (!task || typeof task !== 'object') {
        return false;
    }
    
    // Validate ID: must be positive integer / Validar ID: debe ser número entero positivo
    if (!Number.isInteger(task.id) || task.id <= 0) {
        console.warn(`⚠️ Task with invalid ID detected: ${task.id}`);
        return false;
    }
    
    // Validate title: must be non-empty string / Validar título: debe ser string no vacío
    if (!task.title || typeof task.title !== 'string' || task.title.trim().length === 0) {
        console.warn(`⚠️ Task ID ${task.id} has invalid title`);
        return false;
    }
    
    // Validate status: must be one of allowed values / Validar status: debe ser uno de los valores permitidos
    const validStatuses = ['todo', 'in-progress', 'done'];
    if (!validStatuses.includes(task.status)) {
        console.warn(`⚠️ Task ID ${task.id} has invalid status: "${task.status}"`);
        return false;
    }
    
    // Validate createdAt: must be valid ISO date / Validar createdAt: debe ser fecha válida en ISO
    if (!task.createdAt || isNaN(new Date(task.createdAt).getTime())) {
        console.warn(`⚠️ Task ID ${task.id} has invalid date`);
        return false;
    }
    
    return true;
}

/**
 * Reads tasks from JSON file or creates it if it doesn't exist
 * Lee tareas del archivo JSON o lo crea si no existe
 */
async function ReadTasks(){
    try {
        await fs.access('tasks.json');
        const Tasks = await fs.readFile('tasks.json', 'utf8');
        
        try {
            const ArrayTasks = JSON.parse(Tasks);
            
            // Validate it's an array / Validar que sea un array
            if (!Array.isArray(ArrayTasks)) {
                console.error("❌ Data is not an array. Reinitializing...");
                return [];
            }
            
            // Filter valid tasks and report invalid ones / Filtrar tareas válidas y reportar las inválidas
            const validTasks = ArrayTasks.filter(task => {
                const isValid = isValidTask(task);
                if (!isValid) {
                    console.log(`   → This task will be removed`);
                }
                return isValid;
            });
            
            // If tasks were removed, save clean file / Si se eliminaron tareas, guardar el archivo limpio
            if (validTasks.length !== ArrayTasks.length) {
                console.log(`\n📊 Found ${ArrayTasks.length - validTasks.length} invalid tasks. Cleaning up...`);
                await WriteTasks(validTasks); // Save only valid ones / Guardar solo las válidas
            }
            
            return validTasks;
            
        } catch (parseError) {
            console.error("❌ Corrupted JSON file. Creating backup and starting fresh...");
            const backupPath = `tasks.backup.${Date.now()}.json`;
            await fs.writeFile(backupPath, Tasks);
            console.log(`✅ Backup created: ${backupPath}`);
            return [];
        }
    } catch(error){
        // File doesn't exist - create new / Archivo no existe - crear nuevo
        await fs.writeFile('tasks.json', '[]', 'utf8');
        return [];
    }
}

/**
 * Writes tasks to JSON file
 * Escribe tareas en el archivo JSON
 */
async function WriteTasks(ArrayTasks) {
    try {
        if(!Array.isArray(ArrayTasks)){
            throw new Error("Data must be an array");
        }
        const jsonData = JSON.stringify(ArrayTasks, null, 2);
        await fs.writeFile('tasks.json', jsonData, 'utf-8');
        return true;
    } catch (error) {
        // Handle specific file system errors / Manejar errores específicos del sistema de archivos
        if (error.code === 'EACCES') {
            console.error("❌ Permission denied: Cannot write to tasks.json");
            console.error("💡 Try: chmod 666 tasks.json (Linux/Mac)");            
        }else if (error.code === 'ENOSPC') {
            console.error("❌ No disk space available");            
        }else {
            console.error("❌ Error writing file:", error.message);
        }
        return false;
    }
}

// Constants for valid statuses / Constantes para estados válidos
const VALID_STATUSES = ['todo', 'in-progress', 'done'];

/**
 * Validates if a status is valid
 * Valida si un estado es válido
 */
function isValidStatus(status) {
    return VALID_STATUSES.includes(status);
}

/**
 * Returns an emoji symbol based on task status
 * Retorna un emoji según el estado de la tarea
 */
function StatusSymbol(status){
    // Handle invalid status / Manejar estado inválido
    if (!isValidStatus(status)) {
        console.error(`❌ Invalid status detected: "${status}"`);
        return "❓";
    }
    
    // Map status to emoji / Mapear estado a emoji
    const symbols = {
        "todo": "🔴",
        "in-progress": "🟡", 
        "done": "🟢"
    };
    return symbols[status];
}

/**
 * Handles adding a new task
 * Maneja la adición de una nueva tarea
 */
async function handleAdd(title) {
    // Validate title / Validar título
    if(!title || title.trim().length === 0){
        console.log("❌ Title cannot be empty");
        showHelp();
        return;
    }

    // Remove control characters / Eliminar caracteres de control
    const sanitizedTitle = title.replace(/[\x00-\x1F\x7F]/g, '');
    if (sanitizedTitle.length === 0) {
        console.log("❌ Title contains only invalid characters");
        return;
    }

    const tasks = await ReadTasks();
    // Generate new ID (max existing ID + 1) / Generar nuevo ID (máximo ID existente + 1)
    const lastId = tasks.length > 0 ? Math.max(...tasks.map(t=> t.id)) : 0;
    const newId = lastId + 1;

    const NewTask = {
        id: newId,
        title: sanitizedTitle,
        status: "todo",
        createdAt: new Date().toISOString()
    };

    tasks.push(NewTask);
    await WriteTasks(tasks);  
    console.log(`✅ Task "${sanitizedTitle}" added successfully with ID: ${newId}`);  
}

/**
 * Displays tasks with optional status filter
 * Muestra tareas con filtro opcional por estado
 */
async function ShowTasks(filterStatus = null) {
    const tasks = await ReadTasks();
    
    // Filter tasks if status specified / Filtrar tareas si se especifica estado
    let filteredTasks = tasks;
    if (filterStatus) {
        filteredTasks = tasks.filter(task => task.status === filterStatus);
    }
    
    // Handle empty results / Manejar resultados vacíos
    if (filteredTasks.length === 0) {
        if (filterStatus) {
            console.log(`\n📋 No tasks with status "${filterStatus}" to show`);
        } else {
            console.log('\n📋 No tasks to show');
        }
        return;
    }
    
    // Display header / Mostrar encabezado
    console.log(`\n=== ${filterStatus ? filterStatus.toUpperCase() : 'ALL'} TASKS ===`);
    
    // Display each task / Mostrar cada tarea
    filteredTasks.forEach(task => {
        const symbol = StatusSymbol(task.status);
        const date = new Date(task.createdAt).toLocaleDateString();
        console.log(`${task.id}. [${symbol}] ${task.title} ${date}`);
    });
}

/**
 * Handles updating a task's title and/or status
 * Maneja la actualización del título y/o estado de una tarea
 */
async function handleUpdate(id, newTitle, newStatus) {
    // Validate ID / Validar ID
    if(!id){
        console.log("❌ Task ID is required");
        showHelp();
        return;
    }
    
    const tasks = await ReadTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    // Check if task exists / Verificar si la tarea existe
    if(taskIndex === -1){
        console.log(`❌ Task with ID ${id} doesn't exist`);
        return;
    }
    
    // Update title if provided / Actualizar título si se proporciona
    if (newTitle) {
        tasks[taskIndex].title = newTitle;
    }
    
    // Update status if provided and valid / Actualizar estado si se proporciona y es válido
    if(newStatus){
        const validStatuses = ['todo', 'in-progress', 'done'];
        if(validStatuses.includes(newStatus)){
            tasks[taskIndex].status = newStatus;
        }else{
            console.log(`❌ Invalid status. Use: todo, in-progress, done`);
        }
    }
    
    await WriteTasks(tasks);
    console.log(`✅ Task ID ${id} updated successfully`);
}

/**
 * Handles marking a task with a specific status
 * Maneja el marcado de una tarea con un estado específico
 */
async function handleMarkStatus(id, newStatus) {
    // Validate ID / Validar ID
    if (!id) {
        console.log("❌ Task ID is required");
        showHelp();
        return;
    }
    
    const tasks = await ReadTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    // Check if task exists / Verificar si la tarea existe
    if (taskIndex === -1) {
        console.log(`❌ Task with ID ${id} doesn't exist`);
        return;
    }
    
    // Update status / Actualizar estado
    tasks[taskIndex].status = newStatus;
    
    await WriteTasks(tasks);
    
    const symbol = StatusSymbol(newStatus);
    console.log(`✅ Task "${tasks[taskIndex].title}" marked as ${newStatus} ${symbol}`);
}

/**
 * Handles deleting a task
 * Maneja la eliminación de una tarea
 */
async function handleDelete(id) {
    // Validate ID / Validar ID
    if(!id){
        console.log("❌ Task ID is required");
        showHelp();
        return;
    }

    const tasks = await ReadTasks();
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    // Check if task exists / Verificar si la tarea existe
    if(taskIndex === -1){
        console.log(`❌ Task with ID ${id} doesn't exist`);
        return;
    }
    
    // Store deleted task for confirmation message / Guardar tarea eliminada para mensaje de confirmación
    const deleteTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    
    await WriteTasks(tasks);
    console.log(`✅ Task "${deleteTask.title}" (ID: ${id}) deleted successfully`);    
}

/**
 * Main function - entry point of the application
 * Función principal - punto de entrada de la aplicación
 */
async function main() {
    // Validate file before starting / Validar archivo antes de empezar
    const isValid = await validateTasksFile();
    if (!isValid) {
        console.log("⚠️  Continuing with default behavior...");
    }
    
    // Parse command line arguments / Parsear argumentos de línea de comandos
    const args = process.argv.slice(2);
    const command = args[0];

    // Show help if no command provided / Mostrar ayuda si no se proporciona comando
    if(!command){
        showHelp();
        return;
    }
    
    // List of valid commands / Lista de comandos válidos
    const validCommands = ['add', 'list', 'update', 'delete', 'mark-in-progress', 'mark-done'];
    if (!validCommands.includes(command)){
        console.log(`❌ Unknown command: "${command}"`);
        showHelp();
        return;
    }

    try {
        // Command routing / Enrutamiento de comandos
        switch(command) {
            case 'add':
                // Validate title argument / Validar argumento de título
                if (!args[1]) {
                    console.log("❌ Missing title. Use: node task-manager.js add \"<title>\"");
                    showHelp();
                    break;
                }
                await handleAdd(args[1]);
            break;

            case 'list':
                const filter = args[1];
                // Validate filter if provided / Validar filtro si se proporciona
                if(filter){
                    const validFilters = ['todo', 'in-progress', 'done'];
                    if(!validFilters.includes(filter)){
                        console.log(`❌ Invalid filter. Use: todo, in-progress, done`);
                        showHelp();
                        break;
                    }
                }
                await ShowTasks(filter);
            break;

            case 'update':
                // Validate ID argument / Validar argumento de ID
                if (!args[1]) {
                    console.log("❌ Missing ID. Use: node task-manager.js update <id> [title] [status]");
                    showHelp();
                    break;                    
                }
                const id = parseInt(args[1]);
                if (isNaN(id)) {
                    console.log("❌ Invalid ID. Must be a number");
                    showHelp();
                    break;                    
                }
                await handleUpdate(parseInt(args[1]), args[2], args[3]);
            break;
    
            case 'mark-in-progress':
                await handleMarkStatus(parseInt(args[1]), 'in-progress');
            break;
    
            case 'mark-done':
                await handleMarkStatus(parseInt(args[1]), 'done');
            break;

            case 'delete':
                // Validate ID argument / Validar argumento de ID
                if (!args[1]) {
                    console.log("❌ Missing ID. Use: node task-manager.js delete <id>");
                    showHelp();
                    break;                    
                }
                const deleteId = parseInt(args[1]);
                if (isNaN(deleteId)) {
                    console.log("❌ Invalid ID. Must be a number");
                    break;                    
                }
                await handleDelete(deleteId);
            break;
        }
    } catch(error) {
        // Handle unexpected errors / Manejar errores inesperados
        console.error('❌ Unexpected error:', error.message);
        console.error('💡 Please report this issue if it persists.');
    }
}

/**
 * Displays help information
 * Muestra información de ayuda
 */
function showHelp() {
    console.log(`
    Use: node task-manager.js <command> [arguments]
    
    Commands:
        add "<title>"                    Add new task
        list [status]                     List tasks (optional: filter by status)
        update <id> [title] [status]      Update task
        delete <id>                        Delete task
        mark-in-progress <id>              Mark task as in-progress 🟡
        mark-done <id>                      Mark task as done 🟢

    Examples:
        node task-manager.js add "Buy milk"
        node task-manager.js list
        node task-manager.js list todo
        node task-manager.js mark-done 1
        node task-manager.js mark-in-progress 2
    `);
}

// Start the application / Iniciar la aplicación
main();