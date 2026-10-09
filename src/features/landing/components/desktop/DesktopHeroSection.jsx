import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCloud,
  FiHeadphones,
  FiLock,
  FiSend,
  FiShield,
  FiSmile,
  FiTrendingUp,
} from "react-icons/fi";

import { ROUTES } from "@/constants";
import {
  AppBadge,
  AppBox,
  AppButton,
  AppGrid,
  AppHeading,
  AppStack,
  AppText,
} from "@/components";

const DesktopHeroSection = () => {
  return (
    <section className="w-full overflow-hidden bg-bg pt-8 pb-6">
      <div className="mx-auto max-w-7xl px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <AppBox sx={{ maxWidth: 590 }}>
            <AppBadge
              variant="soft"
              colorVariant="primary"
              rounded="full"
              startIcon={<FiCheckCircle />}
              label="All-in-One Pharmacy Management Software"
              sx={{
                mb: 1.5,
                px: 1.5,
                py: 0.5,
                fontSize: "11px",
                fontWeight: 700,
              }}
            />

            <AppHeading
              level={1}
              weight={800}
              sx={{
                fontSize: {
                  lg: "44px",
                  xl: "46px",
                },
                lineHeight: 1.05,
                letterSpacing: "-1.1px",
                color: "var(--app-color-text)",
                m: 0,
              }}
            >
              <span className="block whitespace-nowrap">
                Simplify Your Pharmacy.{" "}
              </span>
              <span className="block whitespace-nowrap text-primary">
                Grow Your Business.
              </span>
              <span className="block whitespace-nowrap text-primary">
                In Dev(Ansh) branch
              </span>
            </AppHeading>

            <AppText
              variant="body2"
              sx={{
                mt: 1.5,
                maxWidth: 520,
                fontSize: "14px",
                lineHeight: "24px",
                color: "var(--app-color-text-muted)",
              }}
            >
              PharmaERP helps pharmacies automate billing, manage inventory,
              track expiry, handle GST and grow smarter with real-time insights.
            </AppText>

            <AppGrid
              xs={2}
              gap={0}
              sx={{
                mt: 2,
                maxWidth: 500,
                columnGap: 3,
                rowGap: 1.25,
              }}
            >
              <Feature icon={<FiShield />} text="GST Compliant" />
              <Feature icon={<FiSmile />} text="Easy to Use" />
              <Feature icon={<FiLock />} text="Secure & Reliable" />
              <Feature icon={<FiCloud />} text="Cloud Based" />
            </AppGrid>

            <AppStack direction="row" gap={1.5} sx={{ mt: 2.5 }}>
              <AppButton
                component={Link}
                to={ROUTES.REGISTER}
                variant="contained"
                colorVariant="primary"
                rounded="md"
                startIcon={<FiSend />}
                sx={{
                  px: 2.5,
                  py: 1.25,
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "var(--app-shadow-sm)",
                }}
              >
                Start Free Trial
              </AppButton>

              <AppButton
                component={Link}
                to={ROUTES.LOGIN}
                variant="outlined"
                colorVariant="primary"
                rounded="md"
                startIcon={<FiCalendar />}
                sx={{
                  px: 2.5,
                  py: 1.25,
                  fontSize: "14px",
                  fontWeight: 700,
                  bgcolor: "var(--app-color-surface)",
                }}
              >
                Sign In
              </AppButton>
            </AppStack>

            <AppStack
              direction="row"
              align="center"
              gap={1}
              sx={{
                mt: 1.5,
                fontSize: "12px",
                color: "var(--app-color-text-muted)",
              }}
            >
              <FiCheckCircle className="text-primary" />
              <span>No credit card required</span>
              <span>•</span>
              <span>Setup in minutes</span>
            </AppStack>
          </AppBox>

          <div className="flex items-center justify-center">
            <img
              src="/overview-dashboard.png"
              alt="ERP Dashboard"
              className="w-full max-w-[470px] rounded-xl object-contain drop-shadow-[0_14px_26px_rgba(15,23,42,0.12)]"
            />
          </div>
        </div>

        <AppBox
          sx={{
            mx: "auto",
            mt: 3,
            maxWidth: "72rem",
            borderTop: "1px solid var(--app-color-border)",
            pt: 2.5,
          }}
        >
          <AppText
            variant="body1"
            align="center"
            weight={500}
            sx={{
              fontSize: "15px",
              color: "var(--app-color-text)",
            }}
          >
            Trusted by <span className="font-bold text-primary">5,000+</span>{" "}
            Pharmacies Across India
          </AppText>

          <AppGrid xs={1} sm={2} lg={4} gap={3} sx={{ mt: 3 }}>
            <TrustItem
              icon={<FiShield />}
              title="100% Secure"
              text="Your data is safe and protected"
            />

            <TrustItem
              icon={<FiClock />}
              title="Save Time"
              text="Automate tasks and reduce manual work"
            />

            <TrustItem
              icon={<FiTrendingUp />}
              title="Grow Faster"
              text="Insights that help you make better decisions"
            />

            <TrustItem
              icon={<FiHeadphones />}
              title="Dedicated Support"
              text="We're here to help you succeed"
              noBorder
            />
          </AppGrid>
        </AppBox>
      </div>
    </section>
  );
};

const Feature = ({ icon, text }) => {
  return (
    <AppStack
      direction="row"
      align="center"
      gap={1.2}
      sx={{
        minHeight: 32,
      }}
    >
      <AppBox
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          width: 28,
          height: 28,
          minWidth: 28,
          borderRadius: "999px",
          bgcolor: "var(--app-color-primary-soft)",
          color: "var(--app-color-primary)",
          fontSize: "14px",
          lineHeight: 0,
          flexShrink: 0,
        }}
      >
        {icon}
      </AppBox>

      <AppText
        variant="body2"
        weight={500}
        sx={{
          fontSize: "12.5px",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          color: "var(--app-color-text)",
        }}
      >
        {text}
      </AppText>
    </AppStack>
  );
};

const TrustItem = ({ icon, title, text, noBorder }) => {
  return (
    <AppStack
      direction="row"
      align="flex-start"
      gap={2}
      sx={{
        pr: { lg: noBorder ? 0 : 3 },
        borderRight: {
          xs: "none",
          lg: noBorder ? "none" : "1px solid var(--app-color-border)",
        },
      }}
    >
      <AppBox
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          color: "var(--app-color-primary)",
          fontSize: "32px",
        }}
      >
        {icon}
      </AppBox>

      <AppBox>
        <AppHeading
          level={4}
          weight={700}
          sx={{
            m: 0,
            fontSize: "13px",
            color: "var(--app-color-text)",
          }}
        >
          {title}
        </AppHeading>

        <AppText
          variant="body2"
          sx={{
            mt: 0.5,
            fontSize: "12px",
            lineHeight: "20px",
            color: "var(--app-color-text-muted)",
          }}
        >
          {text}
        </AppText>
      </AppBox>
    </AppStack>
  );
};

export default DesktopHeroSection;
