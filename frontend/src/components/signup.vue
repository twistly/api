<template>
    <div class="signin-page">
        <div class="container">
            <form class="form-signin" action="/signin" method="post">
                <h2 class="form-signin-heading">Signin</h2>
                <div class="signin-wrap">
                    <input class="form-control" type="text" placeholder="Username" name="username" autofocus/>
                    <br>
                    <input class="form-control" type="password" placeholder="Password" name="password"/>
                    <label class="checkbox">
                        <span class="pull-right">
                            <a href="/signin#myModal">Forgot Password?</a>
                        </span>
                    </label>
                    <button class="btn btn-theme btn-block" href="/signin" type="submit">
                        <i class="fa fa-lock"></i> SIGN IN
                    </button>
                    <hr>
                    <div class="registration">
                        Don't have an account yet?
                        <br>
                        <a href="/signup">Create an account</a>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'signup'
};
</script>
