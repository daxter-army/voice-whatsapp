from flask import Flask, render_template, request, send_file
import time
import pywhatkit as pwk
from contact import contacts

app = Flask(__name__)

# main homepage
@app.route('/', methods = ["POST"])
def index():
    if request.method == "POST":
        print("route: '/' accessed")

        incoming = request.get_json()
        phrase = incoming['phrase']
        receiver = incoming['receiver']
        task = incoming['task']

        print("phrase : %s" % phrase)
        print("message : %s" % receiver)
        print("task : %s" % task)

        try:
            if task == "whatsapp":
                localtime = time.localtime(time.time())
                pwk.sendwhatmsg(contacts[receiver], phrase, localtime.tm_hour, localtime.tm_min+1)
                return {
                    "response" : 200,
                    "message" : phrase
                }
        except:
            print("Something's wrong...!")


    return {
        "okay" : phrase
    }

@app.route('/gui')
def gui():
    return render_template("gui.html")

@app.route('/favicon.ico')
def favicon():
    return send_file('./static/favicon/favicon-32x32.png')

if __name__ == '__main__':
    app.debug = True
    app.run()