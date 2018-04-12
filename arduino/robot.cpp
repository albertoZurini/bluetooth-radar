#include "Arduino.h"
#include "robot.h"

#define maxTime 1700
#define minTime 1300
#define idleTime 1500

robot::robot(){}

/* ------------------
 *  ULTRASONIC STUFF
 * ------------------
*/
void robot::InitUltrasonic(byte trig, byte echo){
  this->trigPin = trig;
  this->echoPin = echo;
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
}

long robot::Ping()
{
  long duration;
  digitalWrite(this->trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(this->trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(this->trigPin, LOW);
  delayMicroseconds(100);
  duration = pulseIn(this->echoPin, HIGH, 25000); // pin | status to read | 25.000 us = 25 ms ; after timeout returns 0
  return duration;
}

long robot::CalcDist()
{
  long dist = this->Ping()/58; //returns cm
  
  //if(dist<=0) return 90;
  
  return dist; 
}

/* --------------
 *  SERVOS STUFF
 * --------------
*/
void robot::AttachServos(byte leftPin, byte rightPin){
  this->servoRight.attach(rightPin);
  this->servoLeft.attach(leftPin);
}

void robot::DetachServos(){
  this->servoRight.detach();
  this->servoLeft.detach();
}

void robot::RotateRight(){
  this->servoRight.writeMicroseconds(maxTime);
  this->servoLeft.writeMicroseconds(maxTime);
}
void robot::RotateRightSlow(){
  this->servoRight.writeMicroseconds(maxTime-180);
  this->servoLeft.writeMicroseconds(maxTime-180);
}

void robot::StopRotation(){
  this->servoRight.writeMicroseconds(idleTime);
  this->servoLeft.writeMicroseconds(idleTime);
}

void robot::GoAhead(){
  this->servoRight.writeMicroseconds(maxTime-100);
  this->servoLeft.writeMicroseconds(minTime+100);
}
