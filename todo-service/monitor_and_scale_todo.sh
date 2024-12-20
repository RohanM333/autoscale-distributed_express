#!/bin/bash

# Thresholds for scaling
CPU_THRESHOLD=70
MEMORY_THRESHOLD=80
MAX_SERVERS=10
MIN_SERVERS=1

# Function to get average CPU usage of TODO servers
get_cpu_usage() {
  # Replace with the actual command to get CPU usage
  echo $(ssh user@todo-server "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'")
}

# Function to get average memory usage of TODO servers
get_memory_usage() {
  # Replace with the actual command to get memory usage
  echo $(ssh user@todo-server "free | grep Mem | awk '{print $3/$2 * 100.0}'")
}

# Function to add a TODO server
add_todo_server() {
  current_servers=$(cat /path/to/todo_servers.txt | wc -l)
  if [ $current_servers -lt $MAX_SERVERS ]; then
    new_ip="192.168.2.$((current_servers + 4))"
    echo $new_ip >> /path/to/todo_servers.txt
    # Update Nginx load balancer configuration
    echo "server $new_ip:3000;" >> /etc/nginx/conf.d/todo_servers.conf
    nginx -s reload
  fi
}

# Function to remove a TODO server
remove_todo_server() {
  current_servers=$(cat /path/to/todo_servers.txt | wc -l)
  if [ $current_servers -gt $MIN_SERVERS ]; then
    last_ip=$(tail -n 1 /path/to/todo_servers.txt)
    sed -i '$d' /path/to/todo_servers.txt
    sed -i "/server $last_ip:3000;/d" /etc/nginx/conf.d/todo_servers.conf
    nginx -s reload
  fi
}

# Monitor and scale based on thresholds
while true; do
  cpu_usage=$(get_cpu_usage)
  memory_usage=$(get_memory_usage)
  echo "CPU Usage: $cpu_usage%"
  echo "Memory Usage: $memory_usage%"

  if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )) || (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
    echo "High load detected. Adding TODO server..."
    add_todo_server
  else
    echo "Low load detected. Removing TODO server..."
    remove_todo_server
  fi

  sleep 60
done
