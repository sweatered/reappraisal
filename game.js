
$(document).ready(function() {


    var slideNr = -1,
        questionNr = -1,
        canvas = $("#canvas"),
        topSlides = $("#canvas > .slide"),
        staticNexts = $("#canvas > .slide[static] button.next"),
        questionnaireNexts = $("#canvas > .slide[questionnaire] button.next"),
        requiredNexts = $("#canvas > .slide[required] button.next"),
        questionNexts = $("#canvas > .slide[question] button.next"),
        circles = $("#canvas > .slide > .circle"),
        squares = $("#canvas > .slide > .square"),
        gameWinDurationMs = 2000;

    function nextSlide(slides, parentSlides){
        slideNr++;
        if (slideNr >= slides.length && parentSlides !== undefined){
            var slide = $(slides.get(slideNr - 1));
                parentSlide = slide.parent(),
                loop = parentSlide[0].attributes.loop.value;
                position = parseInt(parentSlide.attr("position")),
                nr = parseInt(parentSlide.attr("nr"));

            nr++;

            if (nr >= loops[loop].length){
                slideNr = position;
                nextSlide(parentSlides);
                return;
            }
            else {
                parentSlide.attr("nr", nr);
                slideNr = -1;
                nextSlide(slides);
                return;
            }
        }
        var slide = $(slides.get(slideNr));
        showSlide(slides, slide, parentSlides);
    }
    function nextQuestion(slides){
        slides.each(function(){
            $(this).removeClass("warning");
        });
        var slide = $(slides.get(slideNr));

        if (questionNr >= 0){
            var radio = slide.find("input[name='answer']:checked");
            if (radio.length === 0){
                slide.addClass("warning");
                return;
            }
            
            answers.push([ slide.find("#questionText").html(), radio.val() ]);
            radio.prop("checked", false);
        }
        
        questionNr++;
        showQuestion(slides, slide);
    }

    function showSlide(slides, slide, parentSlides){

        console.log("Showing slide " + slideNr);

        slides.each(function(){
            $(this).hide();
            $(this).removeClass("warning");
        });
        slide.show();
        
        var autonext = slide.attr("autonext");
        if (autonext !== undefined)
        {
            console.log("Skipping in " + autonext + "ms.");
            window.setTimeout(function() { nextSlide(slides, parentSlides); }, parseInt(autonext));
        }

        var questionnaire = slide.attr("questionnaire");
        if (questionnaire !== undefined)
        {
            questionNr = -1;
            nextQuestion(slides);
        }

        var loop = slide.attr("loop");
        if (loop !== undefined)
        {
            loopNr = -1;
            startLoop(slides, slide);
        }
        
        // inside loop
        var parent = slide.parent();
        if (parent.is("[loop]")){
            var nr = parseInt(parent.attr("nr"));
            var loop = parent[0].attributes.loop.value;
            for(var propertyName in loops[loop][nr]) {
                slide.find("[data='"+propertyName+"']").html(loops[loop][nr][propertyName]);
            }
        }

        var game = slide.attr("game");
        if (game !== undefined)
        {
            var nr = parseInt(parent.attr("nr"));
            var loop = parent[0].attributes.loop.value;
            var circle = $(".circle").css("top", loops[loop][nr]["circle_y"]+"px").css("left", loops[loop][nr]["circle_x"]+"px");
            var square = $(".square").css("top", loops[loop][nr]["square_y"]+"px").css("left", loops[loop][nr]["square_x"]+"px");
            startGame();
        }

        var complete = slide.attr("complete");
        if (complete !== undefined)
        {
            var builder = "";
            for (var i in answers){
                for (var j in answers[i]){
                    builder += '"' + answers[i][j] + '",';
                }
                builder += "\n";
            }

            slide.find("#results").val(btoa(builder));
        }

    }

    function showQuestion(slides, slide){
        if (questionNr >= questions.length){
            console.log("Finished questionnaire.");
            nextSlide(slides);
        }
        else {
            console.log("Showing question " + questionNr);
            slide.find("#questionText").html(questions[questionNr]);
        }
    }

    function requiredNext(slides){
        var slide = $(slides.get(slideNr));
        var checked = slide.find("input[type=checkbox]").is(":checked");
        if (checked){
            console.log("Required checkbox checked.");
            nextSlide(slides);
        }
        else {
            console.log("Required checkbox unchecked.");
            slide.addClass("warning");
        }
    }

    function questionNext(slides){
        var slide = $(slides.get(slideNr));
        var textbox = slide.find("input[type=text]");
        if (textbox.val() !== ""){
            console.log("Question answered.");
            answers.push([ slide.attr("question"), textbox.val() ])
            nextSlide(slides);
        }
        else {
            console.log("Required textbox empty.");
            slide.addClass("warning");
        }
    }

    function startLoop(parentSlides, slide){

        slide.attr("position", slideNr);
        slide.attr("nr", "0")
        slideNr = -1;

        var nestedSlides = slide.find(".slide"),
            nestedStaticNexts = slide.find(".slide[static] button.next"),
            nestedQuestionnaireNexts = slide.find(".slide[questionnaire] button.next"),
            nestedRequiredNexts = slide.find(".slide[required] button.next"),
            nestedQuestionNexts = slide.find(".slide[question] button.next"),
            nestedCircles = slide.find(".slide > .circle"),
            nestedSquares = slide.find(".slide > .square");

        nestedStaticNexts.click(function() { nextSlide(nestedSlides, parentSlides); });
        nestedQuestionnaireNexts.click(function() { nextQuestion(nestedSlides, parentSlides); });
        nestedRequiredNexts.click(function(){ requiredNext(nestedSlides, parentSlides); });
        nestedQuestionNexts.click(function(){ questionNext(nestedSlides, parentSlides); });
        nestedCircles.click(function(){ recordCircle(nestedSlides, parentSlides); });
        nestedSquares.click(function(){ recordSquare(nestedSlides, parentSlides); });

        circles.click(function() { recordCircle(nestedSlides, parentSlides); });
        squares.click(function() { recordSquare(nestedSlides, parentSlides); });

        nextSlide(nestedSlides);
    }

    var gameStartTime = 0,
        gameCompleteTime = 0,
        clickedCircle = false,
        clickedSquare = false;

    function startGame(){
        gameStartTime = new Date().getTime();
        gameCompleteTime = 0;
        clickedCircle = false;
        clickedSquare = false;
    }

    function recordCircle(slides, parentSlides){
        console.log("Circle clicked");
        clickedCircle = true;
        checkGame(slides, parentSlides);
    }

    function recordSquare(slides, parentSlides){
        console.log("Square clicked");
        
        if (!clickedCircle){
            console.log("Circle not clicked.");
            return;
        }

        clickedSquare = true;
        checkGame(slides, parentSlides);
    }

    function checkGame(slides, parentSlides){

        if (clickedCircle && clickedSquare){
            gameCompleteTime = new Date().getTime();

            var duration = gameCompleteTime - gameStartTime,
                slide = $(slides.get(slideNr));
                parentSlide = slide.parent(),
                loop = parentSlide[0].attributes.loop.value,
                nr = parseInt(parentSlide.attr("nr")),
                id = loops[loop][nr]["id"],
                result = "";

            console.log("Game took "+duration+"ms")

            if (duration <= gameWinDurationMs){
                result = "SUCCESS";
            }
            else {
                result = "FAIL";
            }

            console.log(id + ": " + result);

            loops[loop][nr].result = result;
            answers.push([ id, result ]);

            nextSlide(slides, parentSlides);
        }
    }

    staticNexts.click(function() { nextSlide(topSlides); });
    questionnaireNexts.click(function() { nextQuestion(topSlides); });
    requiredNexts.click(function(){ requiredNext(topSlides); });
    questionNexts.click(function(){ questionNext(topSlides); });

    circles.click(function() { recordCircle(topSlides); });
    squares.click(function() { recordSquare(topSlides); });

    nextSlide(topSlides);
});