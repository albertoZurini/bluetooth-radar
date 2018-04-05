package com.example.alberto.compass;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;

import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;


public class MainActivity extends AppCompatActivity implements SensorEventListener {

    private float[] mGravity = new float[3];
    private float[] mGeomagnetic = new float[3];
    private float azimuth = 0f;
    private SensorManager mSensorManager;

    private Socket mSocket;

    private Context context;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Save the context
        context = getApplicationContext();

        // Load the saved IP address
        final SharedPreferences sharedPref = this.getPreferences(Context.MODE_PRIVATE);
        String defaultVal = getResources().getString(R.string.ip_address);
        String storedIp = sharedPref.getString(getString(R.string.ip_address), defaultVal);

        final EditText ip_editText = findViewById(R.id.socket_ip_text);
        ip_editText.setText(storedIp);

        // Initialize sensors
        mSensorManager = (SensorManager)getSystemService(SENSOR_SERVICE);


        // Handle click
        Button button = (Button) findViewById(R.id.socket_ip_button);
        button.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                String ipAddress = ip_editText.getText().toString();
                //Toast toast = Toast.makeText(getApplicationContext(), "Ciao", Toast.LENGTH_SHORT);
                //toast.show();

                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putString(getString(R.string.ip_address), ipAddress);
                editor.commit();


                try {
                    mSocket = IO.socket(ipAddress);
                } catch (URISyntaxException e) {
                    Toast toast = Toast.makeText(getApplicationContext(), "Invalid IP address!", Toast.LENGTH_SHORT);
                    toast.show();
                }

                //Log.d("AZIMUTH", String.valueOf(azimuth));



                mSocket.on(Socket.EVENT_CONNECT_ERROR, onConnectError);
                mSocket.on(Socket.EVENT_CONNECT_TIMEOUT, onConnectError);
                mSocket.on(Socket.EVENT_CONNECT, onConnect);
                mSocket.on(Socket.EVENT_DISCONNECT, onDisconnect);
                mSocket.on("getCompass", getCompass);
                mSocket.connect();

                Log.d("click", ipAddress);
            }
        });

    }

    @Override
    protected void onResume() {
        super.onResume();
        mSensorManager.registerListener((SensorEventListener) this, mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD),
                SensorManager.SENSOR_DELAY_GAME);
        mSensorManager.registerListener((SensorEventListener) this, mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER),
                SensorManager.SENSOR_DELAY_GAME);

    }

    @Override
    protected void onPause() {
        super.onPause();
        mSensorManager.unregisterListener((SensorEventListener) this);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        final float alpha = 0.97f;
        synchronized (this) {
            if(event.sensor.getType() == Sensor.TYPE_ACCELEROMETER)
            {
                for(int i=0; i<3; i++)
                    mGravity[i] = alpha*mGravity[i]+(1-alpha)*event.values[i];
            }

            if(event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD)
            {
                for(int i=0; i<3; i++)
                    mGeomagnetic[i] = alpha*mGeomagnetic[i]+(1-alpha)*event.values[i];
            }

            float R[] = new float[9];
            float I[] = new float[9];
            boolean success = SensorManager.getRotationMatrix(R, I, mGravity, mGeomagnetic);
            if(success)
            {
                float orientation[] = new float[3];
                SensorManager.getOrientation(R, orientation);
                azimuth = (float)Math.toDegrees(orientation[0]);
                azimuth = (azimuth+360)%360;
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }

    private Emitter.Listener getCompass = new Emitter.Listener() {
        @Override
        public void call(final Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {

                    Log.d("getCompass", "goAhead");

                    String jsonString = "{'ang': "+String.valueOf(azimuth)+"}";
                    JSONObject obj = null;
                    try {
                        obj = new JSONObject(jsonString);
                        mSocket.emit("resCompass", obj);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                }
            });
        }
    };


    public Emitter.Listener onConnect = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            Log.d("SOCKET_INFO", "Socket Connected!");
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(getApplicationContext(), "Connected to the socket!", Toast.LENGTH_SHORT).show();
                }
            });
        }
    };

    private Emitter.Listener onConnectError = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(getApplicationContext(), "Connection error!", Toast.LENGTH_SHORT).show();
                }
            });
        }
    };
    private Emitter.Listener onDisconnect = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {


                }
            });
        }
    };
}
