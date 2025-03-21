import sys
import threading
import time
import os
import shutil
import subprocess

def send_adb_command(command):
    # Executes an ADB command and returns the output
    try:
        result = subprocess.run(['adb', 'shell', command], capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            return f"Error: {result.stderr.strip()}"
    except Exception as e:
        return f"ADB command execution failed: {e}"




def detect_call_end():
    """
    Detects if the call has ended using ADB.
    Simulates waiting for a call to end by checking the telephony state.
    Returns True if the call has ended, False otherwise.
    """
    print("Checking if call has ended...")

    while True:
        # Run ADB command to get telephony state
        output = send_adb_command("dumpsys telephony.registry | grep mCallState").splitlines()[0]
        print(output)

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

detect_call_end()
