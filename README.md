# 📋 Task Tracker CLI / CLI de Seguimiento de Tareas
https://roadmap.sh/projects/task-tracker

A simple command-line task tracker built with Node.js. No dependencies, just pure Node.js.

Un simple rastreador de tareas para línea de comandos construido con Node.js. Sin dependencias.

Author: EdgarVz

## 📦 Installation / Instalación

    # Clone / Clonar
    git clone https://github.com/EdgarVz/task-tracker
    cd task-tracker

    # Install globally / Instalar globalmente
    npm install -g .

    # Now use from anywhere / Ahora úsalo desde cualquier lugar
    task-manager <command>

## 📋 Commands / Comandos

|Command Arguments|Description/Descripción|
|:-|:-|
|add "<title>"|Add new task / Agregar Tarea|
|list [status]|List tasks (todo/in-progress/done) / Listar tareas|
|update <id> [title] [status]|Update Task / actualizar tareas|
|mark-in-progress <id>|Mark as in-progress 🟡 / Marcar en progreso|
|mark-done <id>|Mark as done 🟢 / Marcar completada|
|Status icons / Iconos de estado| 🔴 todo / 🟡 in-progress / 🟢 done|

## 💡 Examples / Ejemplos

    # Add task / Agregar tarea
    task-manager add "Buy milk"
    # ✅ Task "Buy milk" added with ID: 1

    # List all / Listar todas
    task-manager list
    # 1. [🔴] Buy milk 2024-12-15

    # Mark as done / Marcar completada
    task-manager mark-done 1
    # ✅ Task "Buy milk" marked as done 🟢

    # List completed / Listar completadas
    task-manager list done

    # Delete task / Eliminar tarea
    task-manager delete 1


## 💾 Data Storage / Almacenamiento

    Auto-generated tasks.json in current directory:
    json
    [{"id":1,"title":"Buy milk","status":"todo","createdAt":"2024-12-15T10:30:00.000Z"}]

    Features / Características:

    ✅ Auto-creates if missing / Se crea automáticamente

    ✅ Auto-repairs corrupted files / Auto-repara archivos corruptos

    ✅ Creates backups before fixing / Crea backups antes de reparar

## 🔧 Tech Stack / Tecnologías

    Node.js (native modules only / solo módulos nativos)

    No external dependencies / Sin dependencias externas

    File system: fs.promises

## 🛡️ Error Handling / Manejo de Errores

    Handles: missing args, invalid IDs, wrong status, corrupted JSON, permission issues.

    Maneja: argumentos faltantes, IDs inválidos, estado incorrecto, JSON corrupto, problemas de permisos.

## 📄 License / Licencia

    MIT © EdgarVz
