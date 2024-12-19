#!/bin/bash

CPU_THRESHOLD=70
MEMORY_THRESHOLD=80
MAX_SERVERS=50
MIN_SERVERS=1

get_cpu_usage() {
  echo $(ssh user@master-server "top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'")
}

get_memory_usage() {
  echo $(ssh user@master-server "free | grep Mem | awk '{print $3/$2 * 100.0}'")
}

add_server() {
  current_servers=$(cat /path/to/master_servers.txt | wc -l)
  if [ $current_servers -lt $MAX_SERVERS ]; then
    new_ip="192.168.1.$((current_servers + 3))"
    echo $new_ip >> /path/to/master_servers.txt
    echo "server $new_ip:4000;" >> /etc/nginx/conf.d/master_servers.conf
    nginx -s reload
  fi
}

remove_server() {
  current_servers=$(cat /path/to/master_servers.txt | wc -l)
  if [ $current_servers -gt $MIN_SERVERS ]; then
    last_ip=$(tail -n 1 /path/to/master_servers.txt)
    sed -i '$d' /path/to/master_servers.txt
    sed -i "/server $last_ip:4000;/d" /etc/nginx/conf.d/master_servers.conf
    nginx -s reload
  fi
}

while true; do
  cpu_usage=$(get_cpu_usage)
  memory_usage=$(get_memory_usage)
  echo "CPU Usage: $cpu_usage%"
  echo "Memory Usage: $memory_usage%"

  if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )) || (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
    echo "High load detected. Adding server..."
    add_server
  else
    echo "Low load detected. Removing server..."
    remove_server
  fi

  sleep 60
done
