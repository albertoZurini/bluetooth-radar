#ifndef ROBOT_H
#define ROBOT_H

#include "Arduino.h"
#include <Servo.h>
#include <math.h> // (no semicolon)

class robot
{
  public:
    robot();

    // ultrasonic stuff
    void InitUltrasonic(byte, byte);
    long Ping(); // returns us
    long CalcDist(); // returns mm

    // servos stuff
    void AttachServos(byte, byte);
    void DetachServos();
    void RotateRight();
    void RotateRightSlow();
    void StopRotation();
    void GoAhead();
    
  private:
    byte trigPin, echoPin; // for ultrasonic sensor
    
    Servo servoRight, servoLeft; // for servos
    
    byte CLK_pin, EN_pin, DIO_pin; // for compass
    int X_Data, Y_Data, angle; // for compass readings
};


#endif
