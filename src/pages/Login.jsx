import React from "react";
import styled from "styled-components";

const StyledMainContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background: linear-gradient(315deg, #F8FAFC 0%, white 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StyledBackgroundPattern = styled.div`
  width: 100%;
  height: 1px;
  max-width: 1440px;
  opacity: 0.03;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledContentWrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 64px;
`;

const StyledLogo = styled.img`
  width: 358px;
  height: 188px;
`;

const StyledLoginCard = styled.div`
  width: 480px;
  padding: 56px 48px;
  background: white;
  box-shadow: 0px 20px 60px rgba(0, 0, 0, 0.1);
  border-radius: 32px;
  outline: 3px #ff9000 solid;
  outline-offset: -3px;
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const StyledCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const StyledCardTitle = styled.span`
  color: #ff9000;
  font-size: 32px;
  font-weight: 700;
`;

const StyledCardSubtitle = styled.span`
  color: #64748b;
  font-size: 16px;
  font-weight: 400;
  text-align: center;
`;

const StyledGoogleOAuthButton = styled.button`
  width: 100%;
  height: 64px;
  background: white;
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  outline: 2px #ff9000 solid;
  outline-offset: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 500;
  color: #1a1f35;
`;

const StyledGoogleIcon = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 4px;
`;

const StyledFooterSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const StyledFooterText = styled.span`
  color: #94a3b8;
  font-size: 14px;
`;

const StyledFooterLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const StyledFooterLink = styled.span`
  color: #ff9000;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const StyledDivider = styled.div`
  width: 1px;
  height: 16px;
  background: #e2e8f0;
`;


const Login = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <StyledMainContainer>
      <StyledBackgroundPattern>
      </StyledBackgroundPattern>

      <StyledContentWrapper>
        <StyledLogo src="/img/main.png" alt="logo" />

        <StyledLoginCard>
          <StyledCardHeader>
            <StyledCardTitle>Welcome</StyledCardTitle>
            <StyledCardSubtitle>Sign in to start trading and competing</StyledCardSubtitle>
          </StyledCardHeader>

          <StyledGoogleOAuthButton onClick={handleGoogleLogin}>
            <StyledGoogleIcon src="/img/google.png" alt="pattern"/>
            Continue with Google
          </StyledGoogleOAuthButton>
        </StyledLoginCard>

        <StyledFooterSection>
          <StyledFooterText>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </StyledFooterText>

          <StyledFooterLinks>
            <StyledFooterLink>About</StyledFooterLink>
            <StyledDivider />
            <StyledFooterLink>Help Center</StyledFooterLink>
            <StyledDivider />
            <StyledFooterLink>Contact</StyledFooterLink>
          </StyledFooterLinks>
        </StyledFooterSection>
      </StyledContentWrapper>
    </StyledMainContainer>
  );
};

export default Login;
