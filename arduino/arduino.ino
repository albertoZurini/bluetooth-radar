#include <SoftwareSerial.h>
#include "robot.h"

// bluetooth stuff
#define bluetoothTx 3
#define bluetoothRx 4

// ultrasonic stuff
#define triggerPin 5
#define echoPin 6

// servos stuff
#define servoRightPin 13
#define servoLeftPin 12
 
Servo servoRight;
Servo servoLeft; 

robot myRobot = robot();

SoftwareSerial bluetooth(bluetoothTx, bluetoothRx);

void setup() {
  Serial.begin(9600);  // Begin the serial monitor at 9600bps

  myRobot.AttachServos(servoLeftPin, servoRightPin);
  
  myRobot.InitUltrasonic(triggerPin, echoPin);
  
  bluetooth.begin(115200);  // The Bluetooth Mate defaults to 115200bps
  bluetooth.print("$");  // Print three times individually
  bluetooth.print("$");
  bluetooth.print("$");  // Enter command mode
  delay(100); // Wait for response
/*
  bluetooth.println("SN,SupercazzolaPrematura"); // set name

  bluetooth.print("$");  // Print three times individually
  bluetooth.print("$");
  bluetooth.print("$");  // Enter command mode
  delay(100);*
  */
  bluetooth.println("U,9600,N");  // Temporarily Change the baud rate to 9600, no parity
  delay(100);
  
  bluetooth.begin(9600);  // Start bluetooth serial at 9600
  delay(500);
}

void loop() {

  static char k;
  
  static bool amIRotating = false;
  
  if(bluetooth.available())  // If the bluetooth sent any characters
  {
    // Send any characters the bluetooth prints to the serial monitor
    k = bluetooth.read();
    
    if(k == 'd') { // d = distance
      long nowDistance = myRobot.CalcDist();
  
      String toSend =  "{\"dst\": ";
      toSend += String(nowDistance);
      toSend += "}";
  
      Serial.println(toSend);
      bluetooth.print(toSend);
    }
  
    if(k == 't') { // t = toggle rotation
      if(amIRotating) myRobot.StopRotation();
      else myRobot.RotateRightSlow();
      amIRotating = !amIRotating;
    }
  
    if(k == 's') { // s = stop rotation
      amIRotating = false;
      myRobot.StopRotation();
    }
  
    if(k == 'b') { // b = benchmark
      bluetooth.print('b');
    }
  
    Serial.print("Received from BT: ");
    Serial.println(k);
    
  }
  if(Serial.available())  // If stuff was typed in the serial monitor
  {
    // Send any characters the Serial monitor prints to the bluetooth
    bluetooth.print(Serial.readString());
  }
  
}
