import sys
import threading
import time
import os
import shutil
import subprocess
from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QTextEdit, QMessageBox

# Global variable to track the transfer system status
transfer_system_running = False
transfer_logs = []
transferred_recordings = set()  # To keep track of transferred recordings

def get_latest_recording(folder: str) -> str:
    folder_path = f"/sdcard/Documents/voix/{folder}/"
    try:
        files = send_adb_command(f"ls {folder_path}").splitlines()
        if files:
            latest_file = files[-1]
            return latest_file
    except FileNotFoundError:
        return ""
    return ""

def send_adb_command(command: str) -> str:
    # Executes an ADB command and returns the output
    try:
        result = subprocess.run(['adb', 'shell', command], capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return f"Error: {result.stderr.strip()}"
    except Exception as e:
        return f"ADB command execution failed: {e}"


def adb_pull_file(file_path: str, destination: str) -> str:
    # Pulls a file from the device to the local machine
    try:
        result = subprocess.run(['adb', 'pull', file_path, destination], capture_output=True, text=True)
        if result.returncode == 0:
            return f"File pulled successfully to {destination}"
        else:
            return f"Error: {result.stderr.strip()}"
    except Exception as e:
        return f"ADB pull command failed: {e}"

def detect_call_end() -> bool:
    """
    Detects if the call has ended using ADB.
    Simulates waiting for a call to end by checking the telephony state.
    Returns True if the call has ended, False otherwise.
    """
    print("Checking if call has ended...")

    while True:
        # Run ADB command to get telephony state
        output = send_adb_command("dumpsys telephony.registry | grep mCallState").splitlines()[0]

        # Look for the mCallState key to detect call status
        if "mCallState=0" in output:  # 0 means "No call"
            print("Call has ended.")
            return True
        elif "mCallState=1" in output:  # 1 means "Outgoing call"
            print("Outgoing call in progress...")
        elif "mCallState=2" in output:  # 2 means "Incoming call"
            print("Incoming call in progress...")
        else:
            print("Unable to determine call state.")

        # Wait before checking again
        time.sleep(5)  # Check every 5 seconds

def transfer_last_recording():
    global transfer_logs, transferred_recordings

    # Simulate detecting the end of a call and transferring the latest recording
    if detect_call_end():
        incoming_recording = get_latest_recording("incoming")
        outgoing_recording = get_latest_recording("outgoing")

        if incoming_recording:
            if incoming_recording not in transferred_recordings:
                print(f"Transferring incoming recording: {incoming_recording}")
                adb_pull_file(f"/sdcard/Documents/voix/incoming/{incoming_recording}", ".")
                transfer_logs.append(f"Transferred incoming: {incoming_recording}")
                transferred_recordings.add(incoming_recording)  # Mark as transferred
            else:
                print(f"Incoming recording already transferred: {incoming_recording}")
                transfer_logs.append(f"Incoming recording already transferred: {incoming_recording}")

        elif outgoing_recording:
            if outgoing_recording not in transferred_recordings:
                print(f"Transferring outgoing recording: {outgoing_recording}")
                adb_pull_file(f"/sdcard/Documents/voix/outgoing/{outgoing_recording}", ".")
                transfer_logs.append(f"Transferred outgoing: {outgoing_recording}")
                transferred_recordings.add(outgoing_recording)  # Mark as transferred
            else:
                print(f"Outgoing recording already transferred: {outgoing_recording}")
                transfer_logs.append(f"Outgoing recording already transferred: {outgoing_recording}")

        else:
            print("No recordings found.")
            transfer_logs.append("No recordings found.")
    else:
        print("Call has not ended yet.")
        transfer_logs.append("Call not ended yet.")

# Function to start the transfer system in a background thread
def start_transfer_system():
    global transfer_system_running
    if transfer_system_running:
        QMessageBox.information(window, "Info", "Transfer system is already running.")
        return

    transfer_system_running = True
    transfer_logs.append("Transfer system started.")
    log_text.append("Transfer system started.")

    # Start the transfer process in a background thread
    def run_transfer():
        while transfer_system_running:
            transfer_last_recording()
            time.sleep(10)  # Check for new recordings every 10 seconds

    threading.Thread(target=run_transfer, daemon=True).start()

# Function to stop the transfer system
def stop_transfer_system():
    global transfer_system_running
    transfer_system_running = False
    transfer_logs.append("Transfer system stopped.")
    log_text.append("Transfer system stopped.")

# Function to display transfer logs
def display_logs():
    log_text.clear()
    for log in transfer_logs:
        log_text.append(log)

# Create the main window
app = QApplication(sys.argv)
window = QWidget()
window.setWindowTitle("Call Recording Transfer System")
window.setGeometry(100, 100, 400, 300)

# Create layout
layout = QVBoxLayout()

# Start transfer button
start_button = QPushButton("Start Transfer System")
start_button.clicked.connect(start_transfer_system)
layout.addWidget(start_button)

# Stop transfer button
stop_button = QPushButton("Stop Transfer System")
stop_button.clicked.connect(stop_transfer_system)
layout.addWidget(stop_button)

# Display logs button
display_button = QPushButton("Display Logs")
display_button.clicked.connect(display_logs)
layout.addWidget(display_button)

# Text widget to display logs
log_text = QTextEdit()
log_text.setReadOnly(True)
layout.addWidget(log_text)

# Set the layout for the window
window.setLayout(layout)

# Show the window
window.show()

# Start the application's event loop
sys.exit(app.exec_())
